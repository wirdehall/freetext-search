import { useState, useEffect, useMemo } from 'react';
import { useFreetextFilter } from 'freetext-search/react';
import Table from '../components/table';
import { FreextextFilterHookOptions } from '../../../../src/index-search.types';

const steamColumnsToInclude: string[] = [
  'game_id', 'title', 'release_date', 'all_genres', 'theme', 'art_style', 
  'view_dimension', 'game_mode', 'controls', 'user_rating'
];

const steamColumsToIncludeIndex = steamColumnsToInclude.reduce<Record<string, boolean>>((acc, col) => {
  acc[col] = true; 
  return acc; 
}, {});

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


const dotaColumnsToInclude: string[] = [
  'game_id', 'tournament_en', 'team1', 'team2', 'score1', 'score2', 
  'team1_win', 'bestOf', 'games_played', 'datetime'
];

const dotaColumsToIncludeIndex = dotaColumnsToInclude.reduce<Record<string, boolean>>((acc, col) => {
  acc[col] = true; 
  return acc; 
}, {});

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
        if(dataset === 'steam') {
          setColumns(steamColumnsToInclude);
          setColumnsTranslation(steamColumnTranslations);
        } else {
          setColumns(dotaColumnsToInclude);
          setColumnsTranslation(dotaColumnTranslations);
        }
        const includeIndex = dataset === 'dota' ? dotaColumsToIncludeIndex : steamColumsToIncludeIndex;
        const filteredRows = parsed.map((row) => Object.entries(row).reduce<Record<string, string>>((acc, [key, val]) => {
          if(includeIndex[key]) {
            acc[key] = val;
          }
          return acc;
        }, {}));
        setRows(filteredRows);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [dataset]);

  performance.mark('Filter start');
  const { currentRows, filterText, setFilterText } = useFreetextFilter(rows, undefined, { shortForm: true, charactersToIgnore: '-|:' });
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
