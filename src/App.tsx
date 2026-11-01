import { useEffect, useRef, useState } from 'react'
import { aboutParagraphs } from './content'
import { PixelTransition } from './components/PixelTransition'
import { useScreenTransition } from './hooks/useScreenTransition'
import type { Screen } from './hooks/useScreenTransition'
import { TerminalMenu } from './components/TerminalMenu'
import { Typewriter } from './components/Typewriter'
import './App.css'

const bootText = ['Ah, we have a visitor...', 'Please identify yourself as one of the following...']
const identities = ['Friend', 'Family', 'Recruiter', 'Anonymous', 'Someone else'] as const
type Identity = { label: string; greeting: string }
const defaultIdentity: Identity = { label: 'UNASSIGNED', greeting: '' }

function Identify({ active, onIdentify }: { active: boolean; onIdentify: (identity: Identity) => void }) {
  const [other, setOther] = useState(false)
  const [designation, setDesignation] = useState('')
  const choices = useRef<(HTMLButtonElement | null)[]>([])
  const input = useRef<HTMLInputElement>(null)
  const choose = (index: number) => {
    const label = identities[index]
    if (index === 4) { setOther(true); return }
    onIdentify({
      label: label.toUpperCase(),
      greeting: index === 3 ? 'Identity withheld. Access granted anyway.' : `Hello, ${label.toLowerCase()}.`,
    })
  }
  useEffect(() => {
    if (other && active) input.current?.focus()
  }, [other, active])
  useEffect(() => {
    if (!active || other) return
    const numbers = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
      if (/^[1-5]$/.test(event.key)) { event.preventDefault(); choices.current[Number(event.key) - 1]?.click() }
    }
    window.addEventListener('keydown', numbers)
    return () => window.removeEventListener('keydown', numbers)
  }, [active, other])
  return <>
    <p className="dim">Ah, we have a visitor...</p>
    <h1 tabIndex={-1} data-screen-focus>Please identify yourself as one of the following...</h1>
    {!other ? <>
      <div className="identity-options" role="group" aria-label="Visitor identity">
        {identities.map((label, index) => <button key={label} ref={(node) => { choices.current[index] = node }}
          onClick={() => choose(index)} onKeyDown={(event) => {
            let target: number
            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') target = (index + 1) % identities.length
            else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') target = (index + identities.length - 1) % identities.length
            else if (event.key === 'Home') target = 0
            else if (event.key === 'End') target = identities.length - 1
            else return
            event.preventDefault(); choices.current[target]?.focus()
          }}><span className="dim">[{index + 1}]</span> {label}</button>)}
      </div>
      <p className="instruction">SELECT 1–5 / ARROW KEYS + ENTER / CLICK</p>
    </> : <form className="designation-form" autoComplete="off" onSubmit={(event) => {
      event.preventDefault()
      const value = designation.trim().slice(0, 40)
      if (value) onIdentify({ label: 'VISITOR', greeting: `Hello, ${value}.` })
    }}>
      <label htmlFor="designation">State your designation:</label>
      <input ref={input} id="designation" value={designation} maxLength={40} required
        autoComplete="off" spellCheck={false} aria-describedby="designation-help"
        onChange={(event) => setDesignation(event.target.value.slice(0, 40))} />
      <p id="designation-help" className="instruction">40 CHARACTERS MAX / THIS SESSION ONLY</p>
      <div className="form-actions">
        <button type="submit" disabled={!designation.trim()}>[ CONFIRM ]</button>
        <button type="button" onClick={() => { setOther(false); setDesignation(''); requestAnimationFrame(() => choices.current[4]?.focus()) }}>[ BACK ]</button>
      </div>
    </form>}
  </>
}

function App() {
  const { screen, nextScreen, transitionTo, complete } = useScreenTransition()
  // Memory only: no URL, storage, logging, analytics, or network transport.
  const [identity, setIdentity] = useState<Identity>(defaultIdentity)
  const renderScreen = (view: Screen, active: boolean) => {
    if (view === 'BOOT') return <main className="boot-screen" aria-label="Terminal startup" tabIndex={-1} data-screen-focus>
      <Typewriter paragraphs={bootText} active={active} boot onComplete={() => transitionTo('IDENTIFY')} />
    </main>
    return <div className="terminal">
      <header className="terminal-header">
        <span>RV / PERSONAL ARCHIVE</span><span className="dim">TERMINAL 001</span>
      </header>
      <main className={`terminal-main view-${view.toLowerCase()}`}>
        <div className="access-line"><span>DATABASE ACCESS</span><span>// CLEARANCE: {identity.label}</span></div>
        {view === 'IDENTIFY' && <Identify active={active} onIdentify={(value) => {
          setIdentity(value); transitionTo('GREETING')
        }} />}
        {view === 'GREETING' && <>
          <p className="section-code">SESSION / AUTHORIZATION</p>
          <h1 data-screen-focus tabIndex={-1}>IDENTITY ACKNOWLEDGED</h1>
          <Typewriter paragraphs={[identity.greeting]} active={active} />
          <button className="return-command" onClick={() => transitionTo('MENU')}>[ ENTER DATABASE ]</button>
        </>}
        {view === 'MENU' && <>
          <p className="section-code">INDEX / 00</p>
          <h1 data-screen-focus tabIndex={-1}>RISHI VINOD<span className="cursor" aria-hidden="true" /></h1>
          <p className="archive-subtitle">PERSONAL DATABASE / SELECT A RECORD</p>
          <TerminalMenu onNavigate={transitionTo} />
          <p className="instruction menu-help">ENTER TO EXPAND / ARROWS TO SELECT / ESC TO CLOSE</p>
        </>}
        {view === 'ABOUT' && <>
          <p className="section-code">RECORD / 003 / ABOUT</p>
          <h1 data-screen-focus tabIndex={-1}>A little about me.</h1>
          <div className="about-copy"><Typewriter paragraphs={aboutParagraphs} active={active} /></div>
          <button className="return-command" onClick={() => transitionTo('MENU')}>[ RETURN TO MENU ]</button>
        </>}
        {(['PROJECTS', 'RESUME', 'CONTACT'] as Screen[]).includes(view) && <>
          <p className="section-code">RECORD / {view}</p>
          <h1 data-screen-focus tabIndex={-1}>{view}</h1>
          <p className="locked-record">[ RECORD LOCKED ]<span className="cursor" aria-hidden="true" /></p>
          <button className="return-command" onClick={() => transitionTo('MENU')}>[ RETURN TO MENU ]</button>
        </>}
      </main>
      <footer className="terminal-footer"><span>RISHI VINOD / ARCHIVE</span><span>END OF RECORD</span></footer>
    </div>
  }
  return <PixelTransition screen={screen} nextScreen={nextScreen} complete={complete} render={renderScreen} />
}

export default App
