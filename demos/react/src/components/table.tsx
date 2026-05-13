import { useState, useEffect } from 'react';
import Pagination from '../components/pagination';

const PAGE_SIZE = 50;

type Params = Readonly<{
  rows: ReadonlyArray<Record<string, string>>;
  columns: string[];
  columnsTranslation: Record<string, string>
}>;

export default function Table({ rows, columns, columnsTranslation }: Params) {
  const [page, setPage] = useState(1);

  const pageCount = Math.ceil(rows.length / PAGE_SIZE);
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  return (
    <>
      <p className="count">
        {rows.length} result{rows.length !== 1 ? 's' : ''}
        {' · '}page {page} of {pageCount || 1}
      </p>
      <div className="table">
      <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} />
      <table>
        <thead>
          <tr>
            {columns.map(col => <th key={col}>{columnsTranslation[col] ?? col}</th>)}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, i) => (
            <tr key={i}>
              {columns.map(col => <td key={col}>{row[col]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} />
    </div>
    </>
    
  )
}
