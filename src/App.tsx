import { useEffect, useRef, useState } from 'react'
import softwareArtwork from './assets/project-software.jpg'
import hardwareArtwork from './assets/project-hardware.jpg'
import './App.css'

const projects = [
  { name: 'Project 1', image: softwareArtwork, alt: 'Python, JavaScript, and Java illustrations from the portfolio sketch' },
  { name: 'Project 2', image: hardwareArtwork, alt: 'Single-board computer illustration from the portfolio sketch' },
]
const navigation = ['Home', 'About', 'Projects', 'Contact'] as const

function App() {
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
        <button className="resume-link text-link" onClick={() => setDetail({
          title: 'Résumé', description: 'Your résumé will be available here. Add your résumé PDF when you’re ready.',
        })}>Résumé <span aria-hidden="true">↗</span></button>
      </header>

      <main>
        <section id="home" className="hero page-width" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Place your role here</p>
            <h1 id="hero-title" aria-label="Rishi Vinod"><span>Rishi</span><span>Vinod<span className="name-period">.</span></span></h1>
            <h2 className="hero-tagline">Place one-liner here</h2>
            <p className="hero-description">Place a short introduction here.</p>
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
          <div><h2 id="about-title">A little about me<span className="accent">.</span></h2><p>Place your bio, background, and interests here.</p></div>
        </section>
        <section id="contact" className="secondary-section page-width" aria-labelledby="contact-title">
          <p className="eyebrow">03 / Contact</p>
          <div><h2 id="contact-title">Let’s connect<span className="accent">.</span></h2><p>Place your email and social links here.</p></div>
        </section>
      </main>

      <footer className="page-width"><span>Rishi Vinod</span><a className="text-link" href="#home">Back to top <span aria-hidden="true">↑</span></a></footer>

      <dialog ref={dialogRef} onClose={() => setDetail(null)} aria-labelledby="detail-title" aria-describedby="detail-description">
        <div className="dialog-header"><span className="eyebrow">Coming soon</span><form method="dialog"><button className="close-button" aria-label="Close dialog">×</button></form></div>
        <h2 id="detail-title">{detail?.title}</h2><p id="detail-description">{detail?.description}</p>
        <form method="dialog"><button className="primary-link dialog-done">Got it <span aria-hidden="true">→</span></button></form>
      </dialog>
    </>
  )
}

export default App
