import { useActivity } from '../hooks/useActivity'

type Commit = { sha: string; url: string; repository: string; message: string; date: string }
type Activity = { status: 'ready'; username: string; commits: Commit[]; incomplete: boolean }

function relativeDate(date: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function GitHubPanel() {
  const { data, loading, error } = useActivity<Activity>('api/github/commits', 300_000)
  return (
    <aside className="activity-panel github-panel" aria-labelledby="github-title">
      <div className="activity-heading"><span className="service-icon"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.09 1.15a10.75 10.75 0 0 1 5.62 0c2.15-1.46 3.1-1.15 3.1-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.28-5.14 5.56.4.35.76 1.03.76 2.08v3.1c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" /></svg></span><h2 id="github-title">At the workbench</h2><span className="commit-mark" aria-hidden="true">⌘</span></div>
      <p className="activity-kicker github-kicker">Recent commits · public work</p>
      <div className="github-content" aria-busy={loading}>
        {loading ? <p className="activity-empty">Checking the workbench…</p>
          : error ? <p className="activity-empty">The feed is taking a breather.<span>You can still explore my GitHub below.</span></p>
          : data?.commits.length ? <ol className="commit-list">{data.commits.map((commit) => <li key={commit.url}>
            <a className="tactile" href={commit.url} target="_blank" rel="noopener noreferrer">
              <span className="commit-node" aria-hidden="true" />
              <span className="commit-content"><span className="commit-repo" title={commit.repository}>{commit.repository.split('/').at(-1)}</span><strong>{commit.message}</strong><span className="commit-meta"><code>{commit.sha}</code><time dateTime={commit.date} title={new Date(commit.date).toLocaleString()}>{relativeDate(commit.date)}</time></span></span>
              <span className="track-arrow" aria-hidden="true">↗</span>
            </a>
          </li>)}</ol> : <p className="activity-empty">Nothing public to show just yet.<span>More from the workbench soon.</span></p>}
        {data?.incomplete && <p className="activity-kicker">GitHub returned a partial feed.</p>}
      </div>
      <a className="activity-footer" href={`https://github.com/${data?.username ?? 'rishi-vinod'}`} target="_blank" rel="noopener noreferrer">More on GitHub <span aria-hidden="true">↗</span></a>
    </aside>
  )
}
