// One entry per row: `index` is the lowercased, delimiter-joined text that is searched, `row` is the row it was built from.
export type IndexEntry<T> = Readonly<{ index: string; row: T }>;
export type WriteableIndex<T> = Array<IndexEntry<T>>;
export type Index<T> = ReadonlyArray<IndexEntry<T>>;

export type Primitive = string | number | boolean | null;
export type RowDef<K extends string = never> = Readonly<Record<string,
  [K] extends [never] ? Primitive : Primitive | Record<K, Primitive>
>>;
export type FreetextFilterHookOptions<K extends string = never> = Readonly<{
  columnValueName?: K;
  charactersToIgnore?: string;
  longForm?: boolean;
  shortForm?: boolean;
}>;

export type FreetextFilterOptions = Readonly<{
  ignoreCharactersRegex?: RegExp;
  longForm?: boolean;
  shortForm?: boolean;
}>
