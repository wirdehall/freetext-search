import './pagination.css';

type PaginationProps = {
  count: number;
  page: number;
  onChange: (event: React.MouseEvent<HTMLButtonElement>, value: number) => void;
  color?: 'primary' | 'secondary' | 'standard';
};

const getPageItems = (count: number, page: number): (number | '...')[] => {
  if (count <= 7) {
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  const items: (number | '...')[] = [1];

  if (page > 4) {
    items.push('...');
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  for (let i = start; i <= end; i++) {
    items.push(i);
  }

  if (page < count - 3) {
    items.push('...');
  }

  items.push(count);
  return items;
};

const Pagination = ({ count, page, onChange }: PaginationProps) => {
  if (count <= 1) return null;

  const items = getPageItems(count, page);

  return (
    <nav className='pagination'>
      <button
        className='page-btn arrow'
        disabled={page <= 1}
        onClick={(e) => onChange(e, page - 1)}
        aria-label='Previous page'
      >
        <span aria-hidden="true">‹</span>
      </button>

      {items.map((item, index) =>
        item === '...' ? (
          <span key={`ellipsis-${index}`} className='ellipsis'>…</span>
        ) : (
          <button
            key={item}
            className={`page-btn${item === page ? ' active' : ''}`}
            onClick={(e) => onChange(e, item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        className='page-btn arrow'
        disabled={page >= count}
        onClick={(e) => onChange(e, page + 1)}
        aria-label='Next page'
      >
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
};

export default Pagination;
