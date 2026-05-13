import { indexSearchDelimiter } from "./index-search";
import { Primitive, RowDef, WriteableIndex } from "./index-search.types";

export const buildIndex = <K extends string = never, T extends RowDef<K> = RowDef<K>>(
  rows: ReadonlyArray<T>,
  columnValueName?: K,
  ignoreCharactersFunction?: (colString: string) => string,
) => {
  const ignoreCharactersFunctionEnsured = ignoreCharactersFunction ?? ((colString: string) => colString);
  const index = rows.reduce((acc:  WriteableIndex<T>, row) => {
    const index: string = indexSearchDelimiter + Object.values(row).map((val) => {
      const value: Primitive = columnValueName !== undefined
        ? (val !== null && columnValueName !== undefined && typeof val === 'object' && val[columnValueName] !== undefined
          ? val[columnValueName]
          : val as Primitive
        ): val as Primitive;

      const stringValue = (value || '') + ''; // convert null-values and numbers to string.

      return ignoreCharactersFunctionEnsured(stringValue.toLowerCase());
    }).join(indexSearchDelimiter) + indexSearchDelimiter;
    acc[index] = row;
    return acc;
  }, {});

  return index;
}

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getCharactersToIgnoreFunctionAndRegex = (charactersToIgnore?: string) => {
  if(charactersToIgnore === undefined) {
    return { ignoreCharactersFunction: (colString: string) => colString, ignoreCharactersRegex: undefined };
  } else if(charactersToIgnore.includes('|')) {
    const escaped = charactersToIgnore.split('|').map(escapeRegex).join('|');
    const regex = new RegExp("(" + escaped + ")", "g");
    return {
      ignoreCharactersFunction: (colString: string) => colString.replace(regex, ''),
      ignoreCharactersRegex: regex
    };
  } else {
    const regex = new RegExp(escapeRegex(charactersToIgnore), "g");
    return {
      ignoreCharactersFunction: (colString: string) => colString.replace(regex, ''),
      ignoreCharactersRegex: regex
    };
  }
}
