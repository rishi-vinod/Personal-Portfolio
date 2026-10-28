import { useEffect, useRef, useState } from 'react'
import softwareArtwork from './assets/project-software.jpg'
import hardwareArtwork from './assets/project-hardware.jpg'
import './App.css'
import { SpotifyPanel } from './components/SpotifyPanel'
import { GitHubPanel } from './components/GitHubPanel'
import { useHaptics } from './hooks/useHaptics'
import './components/ActivityPanels.css'

const projects = [
  { name: 'Project 1', image: softwareArtwork, alt: 'Python, JavaScript, and Java illustrations from the portfolio sketch' },
  { name: 'Project 2', image: hardwareArtwork, alt: 'Single-board computer illustration from the portfolio sketch' },
]
const navigation = ['Home', 'About', 'Projects', 'Contact'] as const

function App() {
  const haptics = useHaptics()
  const [activeSection, setActiveSection] = useState('home')
  const [detail, setDetail] = useState<{ title: string; description: string } | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('main > section[id]')
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActiveSection(entry.target.id)
      }
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (detail) dialogRef.current?.showModal()
  }, [detail])

  return (
    <>
      <a className="skip-link" href="#home">Skip to content</a>
      <header className="site-header page-width">
        <a className="brand" href="#home" aria-label="Rishi Vinod home">
          <span className="monogram">rv<span>.</span></span>
          <span className="brand-name">Rishi Vinod</span>
        </a>
        <nav aria-label="Main navigation">
          {navigation.map((label) => (
            <a key={label} href={`#${label.toLowerCase()}`}
              aria-current={activeSection === label.toLowerCase() ? 'location' : undefined}
              onClick={() => setActiveSection(label.toLowerCase())}>
              {label}
            </a>
          ))}
        </nav>
        {import.meta.env.DEV ? (
          <a className="resume-link text-link" href="/__local-resume.pdf" target="_blank" rel="noopener noreferrer">Résumé <span aria-hidden="true">↗</span></a>
        ) : (
          <button className="resume-link text-link" onClick={() => setDetail({
            title: 'Résumé', description: 'My résumé is available on request. Get in touch through LinkedIn in the Contact section.',
          })}>Résumé <span aria-hidden="true">↗</span></button>
        )}
      </header>

      <main>
        <section id="home" className="hero page-width" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Hardware &amp; software</p>
            <h1 id="hero-title" aria-label="Rishi Vinod"><span>Rishi</span><span>Vinod<span className="name-period">.</span></span></h1>
            <h2 className="hero-tagline">Student experimenting at the intersection of hardware and software.</h2>
            <div className="hero-actions">
              <a className="primary-link" href="#projects">Explore projects <span aria-hidden="true">↗</span></a>
              <a className="text-link" href="#about">About me <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <div className="portrait-placeholder" role="img" aria-label="Circular placeholder for your photo">
            <svg className="portrait-ring" viewBox="0 0 600 600" aria-hidden="true">
              <circle className="ring-base" cx="300" cy="300" r="298" />
              <circle className="ring-accent" cx="300" cy="300" r="298" pathLength="100" />
            </svg>
            <div className="portrait-label"><span className="crosshair" aria-hidden="true" /><span>Your photo here</span></div>
          </div>
        </section>

        <div className="activity-panels page-width" aria-label="A little of my day">
          <SpotifyPanel />
          <GitHubPanel />
        </div>

        <section id="projects" className="projects-section" aria-labelledby="projects-title">
          <div className="page-width">
            <div className="section-heading">
              <h2 id="projects-title" className="eyebrow">01 / Selected projects</h2>
              <a className="text-link all-projects" href="#project-list">View all projects <span aria-hidden="true">↗</span></a>
            </div>
            <div className="project-list" id="project-list">
              {projects.map((project) => (
                <button className="project" key={project.name} onClick={() => setDetail({
                  title: project.name, description: 'Place project description here. Project details and links will be added here.',
                })}>
                  <div className="project-artwork"><img src={project.image} alt={project.alt} /></div>
                  <div className="project-copy"><h3>{project.name} <span aria-hidden="true">→</span></h3><p>Place project description here</p></div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="secondary-section page-width" aria-labelledby="about-title">
          <p className="eyebrow">02 / About me</p>
          <div>
            <h2 id="about-title">A little about me<span className="accent">.</span></h2>
            <p>I like understanding what happens between the code I write and the hardware running it. The 1s and 0s on my laptop represent physical states in circuits, with transistors acting as tiny switches. I’m interested in how those simple pieces work together to run a program and put something on a screen.</p>
            <p>That’s why I enjoy working with both hardware and software. Writing the code is one part; figuring out what it makes the hardware do is the part that keeps me curious.</p>
          </div>
        </section>
        <section id="contact" className="secondary-section page-width" aria-labelledby="contact-title">
          <p className="eyebrow">03 / Contact</p>
          <div>
            <h2 id="contact-title">Let’s connect<span className="accent">.</span></h2>
            <div className="contact-links">
              <a className="text-link" href="https://www.linkedin.com/in/rishi-vinod/" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.39-.74 1.36-1.52 2.79-1.52 2.98 0 3.58 1.96 3.58 4.5v5.27Z" /></svg>
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href="https://github.com/rishi-vinod" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.09 1.15a10.75 10.75 0 0 1 5.62 0c2.15-1.46 3.1-1.15 3.1-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.28-5.14 5.56.4.35.76 1.03.76 2.08v3.1c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" /></svg>
                GitHub <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="page-width"><span>Rishi Vinod</span>{haptics.supported && <button className="haptics-toggle" aria-pressed={haptics.enabled} onClick={haptics.toggle}>Tap feedback {haptics.enabled ? 'on' : 'off'}</button>}<a className="text-link" href="#home">Back to top <span aria-hidden="true">↑</span></a></footer>

      <dialog ref={dialogRef} onClose={() => setDetail(null)} aria-labelledby="detail-title" aria-describedby="detail-description">
        <div className="dialog-header"><span className="eyebrow">{detail?.title === 'Résumé' ? 'Available on request' : 'Coming soon'}</span><form method="dialog"><button className="close-button" aria-label="Close dialog">×</button></form></div>
        <h2 id="detail-title">{detail?.title}</h2><p id="detail-description">{detail?.description}</p>
        <form method="dialog"><button className="primary-link dialog-done">Got it <span aria-hidden="true">→</span></button></form>
      </dialog>
    </>
  )
}

export default App
