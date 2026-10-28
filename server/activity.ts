import type { IncomingMessage, ServerResponse } from 'node:http'

type Environment = Record<string, string | undefined>
type Result = { status: number; body: unknown }
type Track = {
  id: string; name: string; type: string; is_local?: boolean; duration_ms: number
  artists: { name: string }[]; album: { images: { url: string }[] }
  external_urls: { spotify?: string }
}
type Commit = {
  sha: string; html_url: string
  repository: { full_name: string; private: boolean }
  commit: { message: string; committer: { date: string } }
}

function trackSummary(track: Track) {
  return {
    id: track.id, title: track.name, artist: track.artists.map(({ name }) => name).join(', '),
    artwork: track.album.images.at(-1)?.url ?? null, url: track.external_urls.spotify,
    durationMs: track.duration_ms,
  }
}

// One cache per server instance. Credentials and upstream responses never reach the browser.
export function createActivityApi(env: Environment, fetcher: typeof fetch = fetch) {
  const cache = new Map<string, { expires: number; result: Result }>()
  const pending = new Map<string, Promise<Result>>()
  let token: { value: string; expires: number } | undefined
  let refreshing: Promise<string> | undefined

  async function accessToken() {
    if (token && token.expires > Date.now()) return token.value
    if (refreshing) return refreshing
    refreshing = (async () => {
      const response = await fetcher('https://accounts.spotify.com/api/token', {
        method: 'POST', signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: `Basic ${Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.SPOTIFY_REFRESH_TOKEN! }),
      })
      if (!response.ok) throw new Error('Spotify authorization unavailable')
      const data = await response.json() as { access_token: string; expires_in: number }
      if (!data.access_token) throw new Error('Missing access token')
      token = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 }
      return token.value
    })()
    try { return await refreshing } finally { refreshing = undefined }
  }

  async function spotify<T>(path: string): Promise<T | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetcher(`https://api.spotify.com/v1/${path}`, {
        headers: { Authorization: `Bearer ${await accessToken()}` }, signal: AbortSignal.timeout(8000),
      })
      if (response.status === 401 && attempt === 0) { token = undefined; continue }
      if (!response.ok) throw new Error('Spotify unavailable')
      return response.status === 204 ? null : response.json() as Promise<T>
    }
    return null
  }

  async function load(path: string): Promise<Result> {
    if (path === '/api/github/commits') {
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
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_REFRESH_TOKEN) {
      return { status: 200, body: { status: 'disconnected' } }
    }
    if (path === '/api/spotify/now-playing') {
      const data = await spotify<{ item: Track | null; is_playing: boolean; progress_ms: number }>('me/player/currently-playing')
      const track = data?.item
      if (!track || track.type !== 'track' || track.is_local) {
        return { status: 200, body: { status: 'idle', track: null } }
      }
      return { status: 200, body: {
        status: data.is_playing ? 'playing' : 'paused', track: trackSummary(track),
        progressMs: data.progress_ms ?? 0, fetchedAt: Date.now(),
      } }
    }
    const data = await spotify<{ items: Track[] }>('me/top/tracks?time_range=short_term&limit=3')
    return { status: 200, body: { status: 'ready', tracks: (data?.items ?? []).map(trackSummary) } }
  }

  const paths = new Map([
    ['/api/spotify/now-playing', 15_000], ['/api/spotify/top-tracks', 600_000],
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
        pending.set(path, load(path).catch((): Result => ({ status: 503, body: { status: 'unavailable' } })).then((loaded) => {
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
