import { useState } from 'react'
import resumeImage from '../assets/resume-public.png'

export function ResumeView() {
  const [zoomed, setZoomed] = useState(false)
  return <>
    <p className="section-code">PERSONNEL FILE / RESUME / 001 PAGE</p>
    <h1 data-screen-focus tabIndex={-1}>RESUME</h1>
    <div className="resume-toolbar">
      <span className="instruction">RISHI VINOD / PROFESSIONAL RECORD</span>
      <button aria-pressed={zoomed} aria-controls="resume-frame" onClick={() => setZoomed((value) => !value)}>
        {zoomed ? '[ FIT TO SCREEN ]' : '[ ZOOM IN ]'}
      </button>
    </div>
    <div id="resume-frame" className={`resume-frame${zoomed ? ' is-zoomed' : ''}`}
      role="region" aria-label="Resume image viewer" tabIndex={0}>
      <img src={resumeImage} width={1836} height={2376}
        alt="Rishi Vinod’s résumé: Computer Engineering at the University of Maryland; autonomous driving simulator, EVE voice assistant, bare-metal GPIO, and autonomous-vehicle research proposal; education, coursework, leadership, and technical skills. Private contact details omitted."
        decoding="async" />
    </div>
    {zoomed && <p className="instruction resume-zoom-help">SCROLL OR USE ARROW KEYS IN THE FRAME TO INSPECT</p>}
  </>
}
