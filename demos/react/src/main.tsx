import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import Simple from './pages/simple'
import BigDataset from './pages/big-dataset'

type View = 'simple' | 'dota' | 'steam'

const paths = ['simple', 'steam', 'dota'];

function Root() {
  const path = useMemo(() => window.location.pathname.slice(1), []);
  const [view, setView] = useState<View>(paths.includes(path) ? path as View : 'simple');
  return (
    <>
      <nav className="top-nav">
        <button
          className={`nav-btn${view === 'simple' ? ' active' : ''}`}
          onClick={() => { setView('simple'); window.history.pushState(undefined, '', '/simple'); }}
        >
          Languages
        </button>
        <button
          className={`nav-btn${view === 'steam' ? ' active' : ''}`}
          onClick={() => { setView('steam'); window.history.pushState(undefined, '', '/steam'); }}
        >
          Steam games
        </button>
        <button
          className={`nav-btn${view === 'dota' ? ' active' : ''}`}
          onClick={() => { setView('dota'); window.history.pushState(undefined, '', '/dota'); }}
        >
          Dota games
        </button>
      </nav>
      {view === 'simple' ? <Simple /> : <BigDataset dataset={view} />}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
