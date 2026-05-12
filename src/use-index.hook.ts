import { useMemo, useState } from "react";
import { freetextFilterByIndex } from "./index-search.helper";
import { buildIndex, getCharactersToIgnoreFunctionAndRegex } from "./index-builder.helper";
import { Index, Options, RowDef } from "./index-search.types";

export const useIndex = <K extends string = never, T extends RowDef<K> = RowDef<K>>(
  rows: ReadonlyArray<T>,
  initialFilterText?: string,
  options?: Options<K>
) => {
  const { columnValueName, charactersToIgnore } = options ?? {};
  const [ filterText, setFilterText ] = useState(initialFilterText ?? '');

  const { ignoreCharactersFunction, ignoreCharactersRegex } = useMemo(() => {
    return getCharactersToIgnoreFunctionAndRegex(charactersToIgnore);
  }, [charactersToIgnore]);

  const index: Index<T> = useMemo(() => {
    return buildIndex(rows, columnValueName, { ignoreCharactersFunction, ignoreCharactersRegex });
  }, [rows, columnValueName, ignoreCharactersFunction, ignoreCharactersRegex]);

  const currentRows = useMemo(() => {
    if(filterText === '') {
      return Object.values(index);
    }

    return freetextFilterByIndex(filterText, index, ignoreCharactersRegex);
  }, [filterText, index, ignoreCharactersRegex]);

  return { currentRows, filterText, setFilterText, index };
}
