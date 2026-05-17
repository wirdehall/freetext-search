export type RangeIndexInstance = Readonly<{ prefix: string | null; number: number; suffix: string | null; }>;
export type RangeIndex = ReadonlyArray<RangeIndexInstance>;

export type WriteableIndex<T> = { [index: string]: { row: T, rangeIndex?: RangeIndex } };
export type Index<T> = Readonly<WriteableIndex<T>>;

export type Primitive = string | number | boolean | null;
export type RowDef<K extends string = never> = Readonly<Record<string,
  [K] extends [never] ? Primitive : Primitive | Record<K, Primitive>
>>;
export type FreetextFilterHookOptions<K extends string = never> = Readonly<{
  columnValueName?: K;
  rangeIndex?: boolean;
  charactersToIgnore?: string;
  longForm?: boolean;
  shortForm?: boolean;
}>;

export type FreetextFilterOptions = Readonly<{
  rangeIndex?: boolean;
  ignoreCharactersRegex?: RegExp;
  longForm?: boolean;
  shortForm?: boolean;
}>