import { useState } from 'react'
import { GuestbookSearch } from './components/GuestbookSearch'
import { GameTest } from './components/GameTest'

type View = 'game' | 'guestbook'

function getInitialView(): View {
  if (typeof window !== 'undefined' && window.location.hash === '#guestbook') {
    return 'guestbook'
  }
  return 'game'
}

function App() {
  const [view, setView] = useState<View>(getInitialView)

  if (view === 'guestbook') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', background: '#333', color: 'white' }}>
          <button onClick={() => { setView('game'); window.location.hash = 'game' }}>
            Back to Game Test
          </button>
        </div>
        <GuestbookSearch />
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GameTest />
      <div style={{ padding: '5px 10px', background: '#222', color: '#666', fontSize: '11px' }}>
        <a
          href="#guestbook"
          onClick={(e) => { e.preventDefault(); setView('guestbook'); window.location.hash = 'guestbook' }}
          style={{ color: '#888' }}
        >
          View Original Guestbook Archive
        </a>
      </div>
    </div>
  )
}

export default App
