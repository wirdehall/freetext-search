export type WriteableIndex<T> = { [index: string]: T };
export type Index<T> = Readonly<WriteableIndex<T>>;

export type Primitive = string | number | boolean | null;
export type RowDef<K extends string = never> = Readonly<Record<string,
  [K] extends [never] ? Primitive : Primitive | Record<K, Primitive>
>>;
export type Options<K extends string = never> = Readonly<{
  columnValueName?: K;
  charactersToIgnore?: string | string[];
}>;
