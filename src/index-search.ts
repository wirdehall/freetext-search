import { FreetextFilterOptions, Index } from "./index-search.types";

export const indexSearchDelimiter = '◬';

type RangeFilter = Readonly<{
  lower: number;
  upper: number;
  prefix: string | null;
  suffix: string | null;
}>;

const parseRangeTokens = (filterText: string): {
  remaining: string;
  inclusionRanges: RangeFilter[];
  exclusionRanges: RangeFilter[];
} => {
  const inclusionRanges: RangeFilter[] = [];
  const exclusionRanges: RangeFilter[] = [];

  const pattern = new RegExp(
    `(!?)(${indexSearchDelimiter}?[^\\s0-9${indexSearchDelimiter}]*)(\\[.*?\\])(?=([^\\s0-9${indexSearchDelimiter}]*${indexSearchDelimiter}?))`, 
    'g'
  );

  const remaining = filterText.replace(pattern, (fullMatch, bang, prefix, bracket, suffix) => {
    const inner = bracket.slice(1, -1);
    const parts = inner.split(':');
    if (parts.length !== 2) return fullMatch;
    const lower = Number(parts[0].replace(/(\d)-/g, '$1'));
    const upper = Number(parts[1].replace(/(\d)-/g, '$1'));
    if (isNaN(lower) || isNaN(upper)) return fullMatch;
    const filter: RangeFilter = {
      lower,
      upper,
      prefix: prefix > '' ? prefix : null,
      suffix: suffix > '' ? suffix : null,
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
  indexes: Index<T>,
  options?: FreetextFilterOptions,
) => {
  const { ignoreCharactersRegex, longForm, shortForm, rangeIndex } = options ?? {};
  const cleanedFilterText = filterText.toLowerCase().trim();
  const filterTextCheckingForStartAndFinish = convertStartAndEndShorthands(
    cleanedFilterText, 
    longForm ?? true, 
    shortForm ?? true
  );

  const { remaining, inclusionRanges, exclusionRanges } = rangeIndex
    ? parseRangeTokens(filterTextCheckingForStartAndFinish)
    : { remaining: filterTextCheckingForStartAndFinish, inclusionRanges: [], exclusionRanges: [] };

  const filterTextCharactersRemoved = ignoreCharactersRegex
    ? remaining.replace(ignoreCharactersRegex, '')
    : remaining;

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

  const rangeFiltered = ((inclusionRanges.length === 0 && exclusionRanges.length === 0) || !rangeIndex)
    ? filteredIndexes
    : filteredIndexes.filter((index) => {
      for (const { lower, upper, prefix, suffix } of inclusionRanges) {
        const hasMatch = indexes[index].rangeIndex!.some((rangeIndex) => 
          rangeIndex.number >= lower && rangeIndex.number <= upper && 
          (prefix == null ? true : rangeIndex.prefix?.endsWith(prefix)) && 
          (suffix == null ? true : rangeIndex.suffix?.startsWith(suffix))
        );
        if(!hasMatch) return false;
      }
      for (const { lower, upper, prefix, suffix } of exclusionRanges) {
        const hasMatch = indexes[index].rangeIndex!.some((rangeIndex) => 
          rangeIndex.number >= lower && rangeIndex.number <= upper && 
          (prefix == null ? true : rangeIndex.prefix?.endsWith(prefix)) && 
          (suffix == null ? true : rangeIndex.suffix?.startsWith(suffix))
        );
        if(hasMatch) return false;
      }
      return true;
    });

  return rangeFiltered.reduce((acc: T[], index) => {
    acc.push(indexes[index].row);
    return acc;
  }, []);
};
