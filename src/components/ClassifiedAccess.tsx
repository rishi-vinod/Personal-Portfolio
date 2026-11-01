import { useEffect, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

// A theatrical access sequence, not authentication. No password is collected.
export function ClassifiedAccess({ active, onUnlock }: { active: boolean; onUnlock: () => void }) {
  const [characters, setCharacters] = useState(0)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => {
      if (reduced || characters === 12) onUnlock()
      else setCharacters((value) => value + 1)
    }, reduced ? 0 : characters === 0 ? 500 : characters === 12 ? 650 : 105)
    return () => window.clearTimeout(timer)
  }, [active, characters, reduced, onUnlock])
  return <>
    <p className="section-code">RESTRICTED RECORDS / ACCESS SEQUENCE</p>
    <h1 data-screen-focus tabIndex={-1}>TOP SECRET</h1>
    <p className="classified-subtitle">FAILED PROJECTS / EXPERIMENTAL ARCHIVE</p>
    <div className="access-sequence">
      <label htmlFor="access-sequence">PASSWORD / AUTOMATIC ENTRY</label>
      <input id="access-sequence" type="password" readOnly value={'*'.repeat(characters)}
        autoComplete="off" tabIndex={-1} aria-label="Automatic masked access sequence" />
      <p className="instruction" role="status">{characters === 12 ? 'ACCESS GRANTED' : 'AUTHORIZING ARCHIVE ACCESS...'}</p>
      <button onClick={onUnlock}>[ SKIP SEQUENCE ]</button>
    </div>
  </>
}
