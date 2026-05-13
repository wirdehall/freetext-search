import './style.css'
import { buildIndex, freetextFilterByIndex } from 'freetext-search'

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

type Language = typeof languages[number]

const index = buildIndex(languages)

const input = document.getElementById('search')  as HTMLInputElement
const tbody = document.getElementById('results') as HTMLTableSectionElement
const count = document.getElementById('count')   as HTMLDivElement

const render = (rows: readonly Language[]) => {
  count.textContent = `${rows.length} result${rows.length !== 1 ? 's' : ''}`
  tbody.innerHTML = rows.map(lang => `
    <tr>
      <td>${lang.name}</td>
      <td>${lang.year}</td>
      <td>${lang.paradigm}</td>
      <td>${lang.typing}</td>
      <td>${lang.influences}</td>
    </tr>
  `).join('')
}

render(languages)

input.addEventListener('input', () => {
  const query = input.value.trim()
  const results = query
    ? freetextFilterByIndex(query, index)
    : (Object.values(index) as Language[])
  render(results)
})
