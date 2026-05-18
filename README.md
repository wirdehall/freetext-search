# freetext-search

Client-side freetext filter with an index-based approach and a query syntax for boolean, phrase, and range searches. Zero dependencies.

---

Filtering rows on the client usually means running the same `.filter()` loop on every keystroke. At a few hundred rows that is fine. At tens of thousands it is not.

`freetext-search` separates two steps that are typically collapsed together: building the index and running the query. You build the index once when your data arrives, then filter against it on every keystroke. The index is a plain object, so it serializes, memoizes trivially, and can live outside a component's render cycle.

Indexing 80,000+ rows takes around 120ms and happens once. Repeated filter queries against that index typically run in single-digit milliseconds. Range queries (numeric filtering) run around 40ms at that scale. Word-anchored ranges — such as `R[15:18]` matching `R16` — run in under 10ms. Actual numbers depend on hardware and data shape. Actual numbers depend on hardware and data shape, but the architecture means the cost does not grow with every keystroke, in fact the first character in a filter is the slowest unless you add a range.

The other thing that separates it from a hand-rolled `.filter()` is the query language. Filtering rows that contain "functional" AND have a year between 1990 and 2000 is `functional [1990:2000]`. Excluding rows that contain "java" is `!java`. Matching an exact phrase is `"multi paradigm"`. You get AND logic by default, negation, phrase matching, numeric ranges, and field-position anchors, all in one input field, with no extra configuration required.

## Install

```sh
npm install freetext-search
```

The React hook is available at the `freetext-search/react` subpath and requires React 17 or later.

## Quick start

### Vanilla JS / TS

```ts
import { buildIndex, freetextFilterByIndex } from 'freetext-search';

const languages = [
  { name: 'TypeScript', year: 2012, paradigm: 'multi-paradigm', typing: 'static' },
  { name: 'Haskell',    year: 1990, paradigm: 'functional',     typing: 'static' },
  { name: 'Python',     year: 1991, paradigm: 'multi-paradigm', typing: 'dynamic' },
];

// Build once when data is available.
const index = buildIndex(languages);

// Call on every keystroke.
const results = freetextFilterByIndex('static [1990:2000]', index);
// => rows where 'typing' is 'static' AND 'year' is between 1990 and 2000
```

### React

```tsx
import { useFreetextFilter } from 'freetext-search/react';

function LanguageTable({ languages }) {
  const { currentRows, filterText, setFilterText } = useFreetextFilter(languages);

  return (
    <>
      <input
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        placeholder="Search..."
      />
      <table>
        <tbody>
          {currentRows.map(row => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.year}</td>
              <td>{row.paradigm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

The hook rebuilds the index when `languages` changes and recomputes `currentRows` when `filterText` changes. Both are memoized internally.

## Query syntax

| Query | Matches |
|---|---|
| `typescript` | Rows containing "typescript" |
| `static typed` | Rows containing both "static" AND "typed" |
| `!java` | Rows that do not contain "java" |
| `"multi paradigm"` | Rows containing the exact phrase "multi paradigm" |
| `!"object oriented"` | Rows that do not contain that exact phrase |
| `[1990:2000]` | Rows containing a number between 1990 and 2000 (inclusive) |
| `![1990:2000]` | Rows that have no number in that range |
| `R[15:18]` | Rows containing `R15`, `R16`, `R17`, or `R18` (range as part of a word; `R 16` does not match) |
| `@start:ml` | Rows where a field starts with "ml" |
| `@:ml` | Same as `@start:ml` (short-form) |
| `ml:@end` | Rows where a field ends with "ml" |
| `ml:@` | Same as `ml:@end` (short-form) |
| `@start:[1990:2000]:@end` | Rows where a field contains only a number in range (a field set to "1998" matches; "Year 1998" does not) |

Syntax can be combined freely. For example, `functional !@start:"Lisp, ML"` returns rows containing "functional" that do not have a field starting with the exact phrase "Lisp, ML".

All matching is case-insensitive.

> Ranges inside exact phrase quotes are not supported. The exact phrase `"Season [2:4]"` will be treat as if you had written `"Season " [2:4]`.

### Filtering dates and times

The `charactersToIgnore` option strips specified characters from both the indexed data and the query before matching. This makes it possible to do range filtering on date and time strings.

Strip hyphens to turn dates into comparable integers:

```ts
import { buildIndex, freetextFilterByIndex, getCharactersToIgnoreFunctionAndRegex } from 'freetext-search';

const { ignoreCharactersFunction, ignoreCharactersRegex } = getCharactersToIgnoreFunctionAndRegex('-');
// '2022-03-10' is indexed as '20220310'

const index = buildIndex(rows, undefined, ignoreCharactersFunction);

// Query [20220101:20221231] or [2022-01-01:2022-12-31] now works against date fields.
const results = freetextFilterByIndex('[20220101:20221231]', index, { ignoreCharactersRegex });
```

To also handle time strings like `23:32:10`, add `':'` to the ignore list using `'-|:'`. The value `23:32:10` is then indexed as `233210`, and you can match against it with `[230000:240000]`.

## API

### `buildIndex(rows, columnValueName?, ignoreCharactersFunction?)`

Builds a search index from an array of objects.

| Parameter | Type | Description |
|---|---|---|
| `rows` | `ReadonlyArray<T>` | The data to index |
| `columnValueName` | `string` (optional) | If your row fields are objects rather than primitives, extract this property from each nested object for indexing |
| `ignoreCharactersFunction` | `(str: string) => string` (optional) | Character-stripping function from `getCharactersToIgnoreFunctionAndRegex` |

Returns an `Index<T>` object. Pass it to `freetextFilterByIndex` as-is.

```ts
// Flat rows
const index = buildIndex(rows);

// Rows with nested objects: { name: { label: 'TypeScript', id: 42 }, year: 2012 }
// Extract 'label' from each nested object for indexing.
const index = buildIndex(rows, 'label');
```

### `freetextFilterByIndex(filterText, index, options?)`

Filters the index using a query string.

| Parameter | Type | Description |
|---|---|---|
| `filterText` | `string` | The search query |
| `index` | `Index<T>` | From `buildIndex` |
| `options.ignoreCharactersRegex` | `RegExp` (optional) | From `getCharactersToIgnoreFunctionAndRegex` |
| `options.longForm` | `boolean` (optional, default `true`) | Enable `@start:` / `:@end` anchors |
| `options.shortForm` | `boolean` (optional, default `true`) | Enable `@:` / `:@` anchors |

Returns `T[]`.

### `getCharactersToIgnoreFunctionAndRegex(charactersToIgnore?)`

Creates a matched pair of a character-stripping function (for indexing) and a regex (for query cleaning). Pass them to `buildIndex` and `freetextFilterByIndex` respectively.

| Parameter | Type | Description |
|---|---|---|
| `charactersToIgnore` | `string` (optional) | A single character, or a pipe-delimited list: `'-'` or `'-\|:'` |

Returns `{ ignoreCharactersFunction, ignoreCharactersRegex }`.

### `useFreetextFilter(rows, initialFilterText?, options?)` (React)

| Parameter | Type | Description |
|---|---|---|
| `rows` | `ReadonlyArray<T>` | The data to filter. A changed reference triggers a re-index. |
| `initialFilterText` | `string` (optional) | Starting value for `filterText` (default: `''`) |
| `options.columnValueName` | `string` (optional) | Same as `buildIndex`'s `columnValueName` |
| `options.charactersToIgnore` | `string` (optional) | Same as `getCharactersToIgnoreFunctionAndRegex`'s argument |
| `options.longForm` | `boolean` (optional, default `true`) | Enable `@start:` / `:@end` |
| `options.shortForm` | `boolean` (optional, default `true`) | Enable `@:` / `:@` |

Returns `{ currentRows, filterText, setFilterText, index }`.

## Known limitations

- Rows with identical field values produce the same index key; only one will appear in results. Rows are considered duplicates if every field value is identical.
- The character `◬` is used internally as a field delimiter. If your data contains it, results will be incorrect.

## License

MIT
