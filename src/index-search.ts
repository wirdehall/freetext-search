import { FreetextFilterOptions, Index } from "./index-search.types";

export const indexSearchDelimiter = '◬';

type RangeFilter = Readonly<{
  lower: number;
  upper: number;
  regex: RegExp;
}>;

type PhraseRangeFilter = Readonly<{
  regex: RegExp;
  groups: ReadonlyArray<{ lower: number; upper: number }>;
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
      regex: RegExp(`${prefix}([0-9]+)${suffix}`, 'g'),
    };
    (bang === '!' ? exclusionRanges : inclusionRanges).push(filter);
    return '';
  });

  return { remaining, inclusionRanges, exclusionRanges };
};

const parsePhraseWithRanges = (
  phraseContent: string,
  ignoreCharactersRegex?: RegExp,
): PhraseRangeFilter | null => {
  const rangePattern = /(\[.*?\])/g;
  const groups: Array<{ lower: number; upper: number }> = [];
  const PLACEHOLDER = '\x00';

  const withPlaceholders = phraseContent.replace(rangePattern, (fullMatch, bracket) => {
    const inner = bracket.slice(1, -1);
    const parts = inner.split(':');
    if (parts.length !== 2) return fullMatch;
    const lower = Number(parts[0].replace(/(\d)-/g, '$1'));
    const upper = Number(parts[1].replace(/(\d)-/g, '$1'));
    if (isNaN(lower) || isNaN(upper)) return fullMatch;
    groups.push({ lower, upper });
    return PLACEHOLDER;
  });

  if (groups.length === 0) return null;

  const stripped = ignoreCharactersRegex
    ? withPlaceholders.replace(ignoreCharactersRegex, '')
    : withPlaceholders;

  const regexStr = stripped
    .split(PLACEHOLDER)
    .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('([0-9]+)');

  return { regex: new RegExp(regexStr, 'g'), groups };
};

const applyIgnoreOutsideBrackets = (text: string, regex: RegExp): string =>
  text.split(/(\[[^\]]*\])/).map((part, i) => i % 2 === 0 ? part.replace(regex, '') : part).join('');

const matchesRange = (searchText: string, { lower, upper, regex }: RangeFilter): boolean => {
  for (const match of searchText.matchAll(regex)) {
    const number = parseInt(match[1]);
    if (number >= lower && number <= upper) return true;
  }
  return false;
};

const matchesPhraseRange = (searchText: string, { regex, groups }: PhraseRangeFilter): boolean => {
  for (const match of searchText.matchAll(regex)) {
    const inRange = groups.every(({ lower, upper }, i) => {
      const n = parseInt(match[i + 1]);
      return n >= lower && n <= upper;
    });
    if (inRange) return true;
  }
  return false;
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
  const { ignoreCharactersRegex, longForm, shortForm } = options ?? {};
  const cleanedFilterText = filterText.toLowerCase().trim();
  const filterTextCheckingForStartAndFinish = convertStartAndEndShorthands(
    cleanedFilterText, 
    longForm ?? true, 
    shortForm ?? true
  );

  const filterTextCharactersRemoved = ignoreCharactersRegex
    ? applyIgnoreOutsideBrackets(filterTextCheckingForStartAndFinish, ignoreCharactersRegex)
    : filterTextCheckingForStartAndFinish;

  const plainPhrasesNotToMatch: string[] = [];
  const phraseRangeExclusionFilters: PhraseRangeFilter[] = [];

  // Find matches like "match whole expression" even if there are spaces.
  const filterTextWithoutSentencesNotToMatch = [ ...filterTextCharactersRemoved.matchAll(/!"(.*?)"/g) ].reduce((acc, match) => {
    const phraseRange = parsePhraseWithRanges(match[1], ignoreCharactersRegex);
    if (phraseRange) {
      phraseRangeExclusionFilters.push(phraseRange);
    } else {
      plainPhrasesNotToMatch.push(match[0]);
    }
    return acc.replace(match[0], '');
  }, filterTextCharactersRemoved).replace(/\s+/g, ' ').trim();

  const plainPhrasesToMatch: string[] = [];
  const phraseRangeFilters: PhraseRangeFilter[] = [];

  // Find matches like "match whole expression" even if there are spaces.
  const filterTextWithoutMatches = [ ...filterTextWithoutSentencesNotToMatch.matchAll(/"(.*?)"/g) ].reduce((acc, match) => {
    const phraseRange = parsePhraseWithRanges(match[1], ignoreCharactersRegex);
    if (phraseRange) {
      phraseRangeFilters.push(phraseRange);
    } else {
      plainPhrasesToMatch.push(match[0]);
    }
    return acc.replace(match[0], '');
  }, filterTextWithoutSentencesNotToMatch).replace(/\s+/g, ' ').trim();

  const { remaining: filterTextWithoutRanges, inclusionRanges, exclusionRanges } = parseRangeTokens(filterTextWithoutMatches);

  const words = filterTextWithoutRanges.split(' ').filter(text => text.length > 0);
  const wordsNotToMatch = words.filter(text => text.startsWith('!'));
  const wordsToMatch = words.filter(text => !text.startsWith('!'));

  const filterStrings = [
    ...plainPhrasesToMatch.map(text => text.replace(/"/g, '')).filter(text => text.length > 0),
    ...wordsToMatch,
  ];

  // Texts not to match are checked after the texts we want to match, because finding matches is faster than filtering away things not to match.
  const notToMatchTexts = [
    ...plainPhrasesNotToMatch.map(text => text.replace('!', '').replace(/"/g, '')).filter(text => text.length > 0),
    ...wordsNotToMatch.map(word => word.replace('!', '')),
  ];

  // One pass over the index. Every check bails out on the first failure, cheapest checks first.
  return indexes.reduce((acc: T[], { index, row }) => {
    // Words and "quoted phrases" that must all be present.
    for (const text of filterStrings) if (!index.includes(text)) return acc;
    // Quoted phrases containing a range, e.g. "season [30:40]", that must all match.
    for (const filter of phraseRangeFilters) if (!matchesPhraseRange(index, filter)) return acc;
    // Negated words and phrases, e.g. !java or !"multi paradigm", none of which may be present.
    for (const text of notToMatchTexts) if (index.includes(text)) return acc;
    // Negated phrases containing a range, e.g. !"season [30:40]", none of which may match.
    for (const filter of phraseRangeExclusionFilters) if (matchesPhraseRange(index, filter)) return acc;
    // Ranges, e.g. [1990:2000] or R[15:18], that must each contain at least one number in the row.
    for (const filter of inclusionRanges) if (!matchesRange(index, filter)) return acc;
    // Negated ranges, e.g. ![1990:2000], that must not contain any number in the row.
    for (const filter of exclusionRanges) if (matchesRange(index, filter)) return acc;
    acc.push(row);
    return acc;
  }, []);
};
