import { useState } from 'react'
import { useActivity } from '../hooks/useActivity'

type Track = { id: string; title: string; artist: string; artwork: string | null; url: string; durationMs: number }
type NowPlaying = { status: 'disconnected' | 'playing' | 'paused' | 'idle'; track?: Track; progressMs?: number }
type TopTracks = { status: 'disconnected' | 'ready'; tracks?: Track[] }

function SpotifyIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.1-10.55-1.14a.75.75 0 1 1-.34-1.46c4.58-1.05 8.5-.6 11.67 1.32.35.22.46.68.25 1.03Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.22-1.98-8.13-2.55-11.95-1.39a.94.94 0 0 1-.54-1.8c4.37-1.32 9.78-.68 13.47 1.59.44.27.58.85.31 1.29Zm.12-3.4C15.22 8.33 8.82 8.12 5.1 9.25a1.13 1.13 0 0 1-.65-2.16c4.28-1.3 11.35-1.05 15.8 1.59a1.13 1.13 0 0 1-1.16 1.94Z" /></svg>
}

export function SpotifyPanel() {
  const [view, setView] = useState<'now' | 'top'>('now')
  const now = useActivity<NowPlaying>('api/spotify/now-playing', 30_000)
  const top = useActivity<TopTracks>('api/spotify/top-tracks', 600_000)
  const current = view === 'now' ? now : top
  const track = now.data?.track
  const playing = now.data?.status === 'playing'
  return (
    <aside className="activity-panel spotify-panel" aria-labelledby="spotify-title">
      <div className="activity-heading"><span className="service-icon spotify-icon"><SpotifyIcon /></span><h2 id="spotify-title">On my wavelength</h2><span className={`activity-dot ${playing && !now.error ? 'is-live' : ''}`} aria-label={playing && !now.error ? 'Listening now' : 'Not live'} /></div>
      <div className="activity-tabs" aria-label="Spotify view">
        <button aria-pressed={view === 'now'} onClick={() => setView('now')}>Now playing</button>
        <button aria-pressed={view === 'top'} onClick={() => setView('top')}>On repeat <span>↗</span></button>
      </div>
      <div className="spotify-content" aria-busy={current.loading}>
        {current.loading ? <p className="activity-empty">Tuning in…</p>
          : current.error ? <p className="activity-empty">Music is out of reach for a moment.<span>Check back in a little while.</span></p>
          : current.data?.status === 'disconnected' ? <div className="activity-empty"><span className="idle-record" aria-hidden="true">♫</span><strong>The soundtrack is coming.</strong><span>A little of what’s in my headphones.</span></div>
          : view === 'now' ? track ? <>
            <a className="now-track tactile" href={track.url} target="_blank" rel="noopener noreferrer">
              {track.artwork ? <img src={track.artwork} width="56" height="56" alt={`${track.title} album cover`} /> : <span className="track-art-fallback">♪</span>}
              <span className="track-copy"><strong>{track.title}</strong><span>{track.artist}</span></span><span className="track-arrow" aria-hidden="true">↗</span>
            </a>
            <div className="playing-caption"><span className={`equalizer ${playing ? 'is-playing' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span>{playing ? 'In my headphones right now' : 'Taking a pause'}</div>
          </> : <div className="activity-empty"><span className="idle-record" aria-hidden="true">♫</span><strong>A quiet moment.</strong><span>No track playing. Explore “On repeat”.</span></div>
          : <><p className="activity-kicker">Favorites · past 4 weeks</p>{top.data?.tracks?.length ? <ol className="top-tracks">{top.data.tracks.map((item, index) => <li key={item.id}><a className="tactile" href={item.url} target="_blank" rel="noopener noreferrer"><span className="track-rank">0{index + 1}</span><span className="track-copy"><strong>{item.title}</strong><span>{item.artist}</span></span><span className="track-arrow" aria-hidden="true">↗</span></a></li>)}</ol> : <p className="activity-empty">Still finding my rotation.</p>}</>}
      </div>
      <a className="activity-footer" href="https://open.spotify.com/" target="_blank" rel="noopener noreferrer">Spotify <span aria-hidden="true">↗</span></a>
    </aside>
  )
}
