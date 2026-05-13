import { useFreetextFilter } from 'freetext-search/react'
import { QueryHints } from '../components/query-hints'

const languages = [
  { name: 'JavaScript', year: 1995, paradigm: 'multi-paradigm',  typing: 'dynamic', influences: 'C, Scheme, Self' },
  { name: 'TypeScript', year: 2012, paradigm: 'multi-paradigm',  typing: 'static',  influences: 'JavaScript, C#, Java' },
  { name: 'Python',     year: 1991, paradigm: 'multi-paradigm',  typing: 'dynamic', influences: 'ABC, Lisp, ML' },
  { name: 'Rust',       year: 2010, paradigm: 'multi-paradigm',  typing: 'static',  influences: 'ML, Haskell, C++' },
  { name: 'Go',         year: 2009, paradigm: 'concurrent',      typing: 'static',  influences: 'C, Pascal, CSP' },
  { name: 'Java',       year: 1995, paradigm: 'object-oriented', typing: 'static',  influences: 'C++, Smalltalk, Ada' },
  { name: 'Haskell',    year: 1990, paradigm: 'functional',      typing: 'static',  influences: 'ML, Miranda, Lisp' },
  { name: 'Erlang',     year: 1986, paradigm: 'concurrent',      typing: 'dynamic', influences: 'Prolog, Smalltalk, ML' },
  { name: 'C++',        year: 1985, paradigm: 'multi-paradigm',  typing: 'static',  influences: 'C, Simula, Ada' },
  { name: 'Ruby',       year: 1995, paradigm: 'object-oriented', typing: 'dynamic', influences: 'Smalltalk, Perl, Lisp' },
  { name: 'Elixir',     year: 2011, paradigm: 'functional',      typing: 'dynamic', influences: 'Erlang, Clojure, Ruby' },
  { name: 'Swift',      year: 2014, paradigm: 'multi-paradigm',  typing: 'static',  influences: 'Objective-C, Haskell, Rust' },
  { name: 'Kotlin',     year: 2011, paradigm: 'multi-paradigm',  typing: 'static',  influences: 'Java, Groovy, Scala' },
  { name: 'Clojure',    year: 2007, paradigm: 'functional',      typing: 'dynamic', influences: 'Lisp, ML, Erlang' },
  { name: 'Scala',      year: 2004, paradigm: 'multi-paradigm',  typing: 'static',  influences: 'Java, Haskell, ML' },
] as const

export default function App() {
  const { currentRows, filterText, setFilterText } = useFreetextFilter(languages)

  return (
    <div className="app">
      <h1>freetext-search — react demo</h1>
      <QueryHints />
      <input
        className="search-input"
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        placeholder="Search languages…"
        autoFocus
      />
      <p className="count">
        {currentRows.length} result{currentRows.length !== 1 ? 's' : ''}
      </p>
      <table>
        <thead>
          <tr>
            {['Name', 'Year', 'Paradigm', 'Typing', 'Influences'].map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.map(lang => (
            <tr key={lang.name}>
              <td>{lang.name}</td>
              <td>{lang.year}</td>
              <td>{lang.paradigm}</td>
              <td>{lang.typing}</td>
              <td>{lang.influences}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
