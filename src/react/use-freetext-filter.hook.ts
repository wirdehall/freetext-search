import { useMemo, useState } from "react";
import { freetextFilterByIndex } from "../index-search";
import { buildIndex, getCharactersToIgnoreFunctionAndRegex } from "../index-builder";
import { Index, FreextextFilterHookOptions, RowDef } from "../index-search.types";

export const useFreetextFilter = <K extends string = never, T extends RowDef<K> = RowDef<K>>(
  rows: ReadonlyArray<T>,
  initialFilterText?: string,
  options?: FreextextFilterHookOptions<K>
): { 
  currentRows: ReadonlyArray<T>, 
  filterText: string, 
  setFilterText: React.Dispatch<React.SetStateAction<string>>, 
  index: Index<T>
} => {
  const [ filterText, setFilterText ] = useState(initialFilterText ?? '');

  const { ignoreCharactersFunction, ignoreCharactersRegex } = useMemo(() => {
    console.log('Recalculate characters to ignore values!');
    return getCharactersToIgnoreFunctionAndRegex(options?.charactersToIgnore);
  }, [options?.charactersToIgnore]);

  const index: Index<T> = useMemo(() => {
    console.log('Rebuild index!');
    return buildIndex(rows, options?.columnValueName, ignoreCharactersFunction);
  }, [rows, options?.columnValueName, ignoreCharactersFunction]);

  const currentRows = useMemo(() => {
    console.log('Recalculate current rows!', filterText, ignoreCharactersRegex);
    if(filterText === '') {
      return Object.values(index);
    }

    return freetextFilterByIndex(filterText, index, { 
      ignoreCharactersRegex, 
      longForm: options?.longForm, 
      shortForm: options?.shortForm 
    });
  }, [filterText, index, ignoreCharactersRegex]);

  return { currentRows, filterText, setFilterText, index };
}
