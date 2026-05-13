import { FreetextFilterOptions } from "./index-search.types";

export const indexSearchDelimiter = '◬';

type RangeFilter = Readonly<{
  lower: number;
  upper: number;
  startAnchor: boolean;
  endAnchor: boolean;
}>;

const NUM_ANY = /\d+/g;
const NUM_START = /(?<=◬)\d+/g;
const NUM_END = /\d+(?=◬)/g;
const NUM_BOTH = /(?<=◬)\d+(?=◬)/g;

const extractNumbers = (str: string, startAnchor: boolean, endAnchor: boolean): number[] => {
  const pattern = startAnchor && endAnchor ? NUM_BOTH
    : startAnchor ? NUM_START
    : endAnchor ? NUM_END
    : NUM_ANY;
  return (str.match(pattern) ?? []).map(Number);
};

const parseRangeTokens = (filterText: string, longForm: boolean, shortForm: boolean): {
  remaining: string;
  inclusionRanges: RangeFilter[];
  exclusionRanges: RangeFilter[];
} => {
  const inclusionRanges: RangeFilter[] = [];
  const exclusionRanges: RangeFilter[] = [];

  const startParts: string[] = [];
  if (longForm) startParts.push('@start:');
  if (shortForm) startParts.push('@:');
  const endParts: string[] = [];
  if (longForm) endParts.push(':@end');
  if (shortForm) endParts.push(':@');

  const startGroup = startParts.length > 0 ? `(${startParts.join('|')})?` : '()';
  const endGroup = endParts.length > 0 ? `(${endParts.join('|')})?` : '()';
  const pattern = new RegExp(`(!?)${startGroup}(\\[.*?\\])${endGroup}`, 'g');

  const remaining = filterText.replace(pattern, (fullMatch, bang, startPrefix, bracket, endSuffix) => {
    const inner = bracket.slice(1, -1);
    const parts = inner.split(':');
    if (parts.length !== 2) return fullMatch;
    const lower = Number(parts[0].replace(/(\d)-/g, '$1'));
    const upper = Number(parts[1].replace(/(\d)-/g, '$1'));
    if (isNaN(lower) || isNaN(upper)) return fullMatch;
    const filter: RangeFilter = {
      lower,
      upper,
      startAnchor: !!startPrefix,
      endAnchor: !!endSuffix,
    };
    (bang === '!' ? exclusionRanges : inclusionRanges).push(filter);
    return '';
  });

  return { remaining, inclusionRanges, exclusionRanges };
};

const longFormParts = { start: '@start:', end: ':@end' };
const shortFormParts = { start: '@:', end: ':@' };

const convertStartAndEndShorthands = (filterText: string, longForm: boolean, shortForm: boolean) => {
  const conversionParts = [];
  if(longForm) conversionParts.push(longFormParts);
  if(shortForm) conversionParts.push(shortFormParts);

  return conversionParts.reduce((acc, parts) => {
    return acc
      .replaceAll(`${parts.start}!"`, `!"${indexSearchDelimiter}`)
      .replaceAll(`${parts.start}"`, `"${indexSearchDelimiter}`)
      .replaceAll(parts.start, indexSearchDelimiter)
      .replaceAll(`"${parts.end}`, `${indexSearchDelimiter}"`)
      .replaceAll(parts.end, indexSearchDelimiter);
  }, filterText);
}

export const freetextFilterByIndex = <T>(
  filterText: string,
  indexes: Readonly<{ [index: string]: T }>,
  options?: FreetextFilterOptions,
) => {
  const { ignoreCharactersRegex, longForm, shortForm } = options ?? {};
  const { remaining, inclusionRanges, exclusionRanges } = parseRangeTokens(filterText, longForm ?? true, shortForm ?? false);
  const cleanedFilterText = remaining.toLowerCase().trim();
  const filterTextCheckingForStartAndFinish = convertStartAndEndShorthands(
    cleanedFilterText, 
    longForm ?? true, 
    shortForm ?? false
  );
  const filterTextCharactersRemoved = ignoreCharactersRegex
    ? filterTextCheckingForStartAndFinish.replace(ignoreCharactersRegex, '')
    : filterTextCheckingForStartAndFinish;
  // Find matches like "match whole expression" even if there are spaces.
  const sentencesNotToMatch = [ ...filterTextCharactersRemoved.matchAll(/!"(.*?)"/g) ].map(match => match[0]);

  // Remove matches from filter text.
  const filterTextWithoutSentencesNotToMatch = sentencesNotToMatch.reduce((acc, match) => {
    return acc.replace(match, '');
  }, filterTextCharactersRemoved).replace(/\s+/g, ' ').trim();

  // Find matches like "match whole expression" even if there are spaces.
  const sentencesToMatch = [ ...filterTextWithoutSentencesNotToMatch.matchAll(/"(.*?)"/g) ].map(match => match[0]);
  // Remove matches from filter text.
  const filterTextWithoutMatches = sentencesToMatch.reduce((acc, match) => {
    return acc.replace(match, '');
  }, filterTextWithoutSentencesNotToMatch).replace(/\s+/g, ' ').trim();

  const words = filterTextWithoutMatches.split(' ').filter(text => text.length > 0);
  const wordsNotToMatch = words.filter(text => text.startsWith('!'));
  const wordsToMatch = words.filter(text => !text.startsWith('!'));

  const filterStrings = [
    ...sentencesToMatch.map(text => text.replace(/"/g, '')).filter(text => text.length > 0),
    ...wordsToMatch,
  ];

  const filteredIndexesForMatches = filterStrings.reduce((acc, filterString) => {
    return acc.filter((index) => index.includes(filterString));
  }, Object.keys(indexes));

  // Filter away all texts not to match after we filter for what we want to match because finding matches is faster than filtering away things not to match.
  const notToMatchTexts = [
    ...sentencesNotToMatch.map(text => text.replace('!', '').replace(/"/g, '')).filter(text => text.length > 0),
    ...wordsNotToMatch.map(word => word.replace('!', '')),
  ];

  const filteredIndexes = notToMatchTexts.reduce((acc, filterString) => {
    return acc.filter((index) => !index.includes(filterString));
  }, filteredIndexesForMatches);

  const rangeFiltered = (inclusionRanges.length === 0 && exclusionRanges.length === 0)
    ? filteredIndexes
    : filteredIndexes.filter((index) => {
      for (const { lower, upper, startAnchor, endAnchor } of inclusionRanges) {
        const nums = extractNumbers(index, startAnchor, endAnchor);
        if (!nums.some(n => n >= lower && n <= upper)) return false;
      }
      for (const { lower, upper, startAnchor, endAnchor } of exclusionRanges) {
        const nums = extractNumbers(index, startAnchor, endAnchor);
        if (nums.some(n => n >= lower && n <= upper)) return false;
      }
      return true;
    });

  return rangeFiltered.reduce((acc: T[], index) => {
    acc.push(indexes[index]);
    return acc;
  }, []);
};
