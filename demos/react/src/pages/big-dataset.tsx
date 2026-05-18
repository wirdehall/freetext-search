import { useState, useEffect, useMemo } from 'react';
import { useFreetextFilter } from 'freetext-search/react';
import Table from '../components/table';

const steamColumnTranslations: Record<string, string> = {
  'game_id': 'Id',
  'title': 'Title',
  'release_date': 'Released',
  'all_genres': 'Genres',
  'theme': 'Theme',
  'art_style': 'Style',
  'view_dimension': 'View',
  'game_mode': 'Mode',
  'controls': 'Controls',
  'user_rating': 'Rating'
}

const dotaColumnTranslations: Record<string, string> = {
  'game_id': 'Id',
  'tournament_en': 'Tournament',
  'team1': 'Team 1',
  'team2': 'Team 2',
  'score1': 'Score T1',
  'score2': 'Score T2',
  'team1_win': 'T1 wins',
  'bestOf': 'Best of',
  'games_played': '# games',
  'datetime': 'When'
}

function parseRow(line: string): string[] {
  const fields: string[] = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue }
    if (ch === ',' && !inQ) { fields.push(cur); cur = ''; continue }
    cur += ch
  }
  fields.push(cur)
  return fields
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim())
  const headers = parseRow(lines[0])
  return lines.slice(1).map(line => {
    const values = parseRow(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

type Params = { dataset: 'dota' | 'steam'};

export default function BigDataset({ dataset }: Params) {
  const debug = useMemo(() => window.location.pathname.slice(1).split('/')[1], []);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnsTranslation, setColumnsTranslation] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const filepath = dataset === 'dota' 
      ? '/data/dota_games.csv' 
      : '/data/steam_dataset.csv';
    fetch(filepath)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load dataset (${r.status})`)
        return r.text()
      })
      .then(text => {
        const parsed = parseCsv(text);
        setColumns(Object.keys(parsed[0]));
        if(dataset === 'steam') {
          setColumnsTranslation(steamColumnTranslations);
        } else {
          setColumnsTranslation(dotaColumnTranslations);
        }
        setRows(parsed);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [dataset]);

  performance.mark('Filter start');
  const { currentRows, filterText, setFilterText } = useFreetextFilter(rows, undefined, { charactersToIgnore: '-|:' });
  performance.mark('Filter end');
  console.log(performance.measure('Filter', 'Filter start', 'Filter end'));

  if (loading) {
    return <div className="app"><p className="status-message">Loading dataset…</p></div>
  }

  if (error) {
    return (
      <div className="app">
        <p className="status-message error">
          {error}
          <br />
          <small>Make sure the CSV is at <code>demos/react/public/data/ultimate_games_dataset.csv</code></small>
        </p>
      </div>
    )
  }

  return (
    <div className="app">
      <h1>freetext-search — games dataset</h1>
      { debug && 
        <div className="sliding-rect-wrapper">
          <div className="sliding-rect" />
        </div>
      }
      <input
        className="search-input"
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        placeholder="Search games…"
        autoFocus
      />
      <Table rows={currentRows} columns={columns} columnsTranslation={columnsTranslation} />
    </div>
  )
}
