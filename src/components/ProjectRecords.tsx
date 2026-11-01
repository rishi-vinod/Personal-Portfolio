import { projectRecords } from '../projectRecords'

export function ProjectRecords() {
  return <>
    <p className="section-code">INDEX / PROJECT RECORDS / 004 ENTRIES</p>
    <h1 data-screen-focus tabIndex={-1}>PROJECTS</h1>
    <p className="archive-subtitle">SELECT A RECORD TO EXPAND</p>
    <div className="project-records">
      {projectRecords.map((project) => <details className="project-record" key={project.id}>
        <summary>
          <span className="record-number">RECORD {project.id}</span>
          <span className="record-title">{project.title}</span>
          <span className="record-toggle" aria-hidden="true" />
        </summary>
        <div className="record-details">
          <p className="record-meta"><span>{project.status}</span><span>{project.dates}</span></p>
          {project.technologies && <p className="record-technologies">{project.technologies}</p>}
          <ul>{project.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
        </div>
      </details>)}
    </div>
  </>
}
