import { indexSearchdelimiter } from "./index-search.helper";
import { Primitive, RowDef, WriteableIndex } from "./index-search.types";

export const buildIndex = <K extends string = never, T extends RowDef<K> = RowDef<K>>(
  rows: ReadonlyArray<T>,
  columnValueName?: K,
  charactersToIgnoreObject?: {
    ignoreCharactersFunction: (colString: string) => string;
    ignoreCharactersRegex?: RegExp;
  },
) => {
  const { ignoreCharactersFunction, ignoreCharactersRegex } = charactersToIgnoreObject
    ?? {
      ignoreCharactersFunction: (colString: string) => colString ,
      ignoreCharactersRegex: undefined
    };
  const index = rows.reduce((acc:  WriteableIndex<T>, row) => {
    const index: string = indexSearchdelimiter + Object.values(row).map((val) => {
      const value: Primitive = columnValueName !== undefined
        ? (val !== null && columnValueName !== undefined && typeof val === 'object' && val[columnValueName] !== undefined
          ? val[columnValueName]
          : val as Primitive
        ): val as Primitive;

      const stringValue = (value || '') + ''; // convert null-values and numbers to string.

      return ignoreCharactersFunction(stringValue.toLowerCase());
    }).join(indexSearchdelimiter) + indexSearchdelimiter;
    acc[index] = row;
    return acc;
  }, {});

  return index;
}

export const getCharactersToIgnoreFunctionAndRegex = (charactersToIgnore?: string | string[]) => {
  if(charactersToIgnore === undefined) {
    return { ignoreCharactersFunction: (colString: string) => colString, ignoreCharactersRegex: undefined };
  } else if(Array.isArray(charactersToIgnore)) {
    const regex = new RegExp("(" + charactersToIgnore.join('|') + ")", "g");
    return {
      ignoreCharactersFunction: (colString: string) => colString.replace(regex, ''),
      ignoreCharactersRegex: regex
    };
  } else {
    const regex = new RegExp(charactersToIgnore, "g");
    return {
      ignoreCharactersFunction: (colString: string) => colString.replace(regex, ''),
      ignoreCharactersRegex: regex
    };
  }
}
