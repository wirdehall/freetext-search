import { useMemo, useState } from "react";
import { freetextFilterByIndex } from "../index-search";
import { buildIndex, getCharactersToIgnoreFunctionAndRegex } from "../index-builder";
import { Index, FreetextFilterHookOptions, RowDef } from "../index-search.types";

export const useFreetextFilter = <K extends string = never, T extends RowDef<K> = RowDef<K>>(
  rows: ReadonlyArray<T>,
  initialFilterText?: string,
  options?: FreetextFilterHookOptions<K>
): { 
  currentRows: ReadonlyArray<T>, 
  filterText: string, 
  setFilterText: React.Dispatch<React.SetStateAction<string>>, 
  index: Index<T>
} => {
  const [ filterText, setFilterText ] = useState(initialFilterText ?? '');

  const { ignoreCharactersFunction, ignoreCharactersRegex } = useMemo(() => {
    return getCharactersToIgnoreFunctionAndRegex(options?.charactersToIgnore);
  }, [options?.charactersToIgnore]);

  const index: Index<T> = useMemo(() => {
    return buildIndex(rows, options?.columnValueName, options?.rangeIndex, ignoreCharactersFunction);
  }, [rows, options?.columnValueName, ignoreCharactersFunction]);

  const currentRows = useMemo(() => {
    if(filterText === '') {
      return Object.values(index).map(indexRow => indexRow.row);
    }

    return freetextFilterByIndex(filterText, index, {
      rangeIndex: options?.rangeIndex,
      ignoreCharactersRegex,
      longForm: options?.longForm,
      shortForm: options?.shortForm
    });
  }, [filterText, index, ignoreCharactersRegex, options?.longForm, options?.shortForm]);

  return { currentRows, filterText, setFilterText, index };
}
