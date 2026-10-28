import type { IncomingMessage, ServerResponse } from 'node:http'

type Environment = Record<string, string | undefined>
type Result = { status: number; body: unknown }
type Commit = {
  sha: string; html_url: string
  repository: { full_name: string; private: boolean }
  commit: { message: string; committer: { date: string } }
}

// One cache per server instance; return only public commit summaries.
export function createActivityApi(env: Environment, fetcher: typeof fetch = fetch) {
  const cache = new Map<string, { expires: number; result: Result }>()
  const pending = new Map<string, Promise<Result>>()
  async function load(): Promise<Result> {
    const username = env.GITHUB_USERNAME || 'rishi-vinod'
    if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) throw new Error('Invalid GitHub username')
    const query = new URLSearchParams({ q: `author:${username}`, sort: 'committer-date', order: 'desc', per_page: '30' })
    // No token is sent: the search can only return public activity.
    const response = await fetcher(`https://api.github.com/search/commits?${query}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'rishi-vinod-portfolio', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error('GitHub unavailable')
    const data = await response.json() as { items: Commit[]; incomplete_results: boolean }
    const seen = new Set<string>()
    const commits = data.items.filter((item) => {
      if (item.repository.private !== false || seen.has(item.sha)) return false
      seen.add(item.sha)
      return true
    }).slice(0, 3).map((item) => ({
      sha: item.sha.slice(0, 7), url: item.html_url, repository: item.repository.full_name,
      message: item.commit.message.split('\n')[0].slice(0, 160), date: item.commit.committer.date,
    }))
    return { status: 200, body: { status: 'ready', username, commits, incomplete: data.incomplete_results } }
  }

  const paths = new Map([
    ['/api/github/commits', 300_000],
  ])

  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const path = request.url?.split('?')[0] ?? ''
    if (!paths.has(path)) return next()
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Cache-Control', 'no-store')
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' })
      return response.end(JSON.stringify({ status: 'method_not_allowed' }))
    }
    const cached = cache.get(path)
    let result = cached && cached.expires > Date.now() ? cached.result : undefined
    if (!result) {
      if (!pending.has(path)) {
        pending.set(path, load().catch((): Result => ({ status: 503, body: { status: 'unavailable' } })).then((loaded) => {
          cache.set(path, { result: loaded, expires: Date.now() + (loaded.status === 200 ? paths.get(path)! : 30_000) })
          return loaded
        }).finally(() => pending.delete(path)))
      }
      result = await pending.get(path)!
    }
    response.statusCode = result.status
    response.end(request.method === 'HEAD' ? undefined : JSON.stringify(result.body))
  }
}
