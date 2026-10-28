import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createActivityApi } from './activity.ts'

const credentials = { SPOTIFY_CLIENT_ID: 'id', SPOTIFY_CLIENT_SECRET: 'secret', SPOTIFY_REFRESH_TOKEN: 'refresh' }
const track = {
  id: 'song', name: 'Test song', type: 'track', duration_ms: 180000,
  artists: [{ name: 'Artist' }], album: { images: [{ url: 'https://i.scdn.co/art.jpg' }] },
  external_urls: { spotify: 'https://open.spotify.com/track/song' },
}

async function withApi(env: Record<string, string>, upstream: typeof fetch, check: (url: string) => Promise<void>) {
  const api = createActivityApi(env, upstream)
  const server = createServer((req, res) => { void api(req, res, () => { res.writeHead(404); res.end() }) })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  try { await check(`http://127.0.0.1:${address.port}`) }
  finally { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())) }
}

test('missing Spotify credentials produces a safe disconnected state without upstream calls', async () => {
  await withApi({}, async () => { throw new Error('Must not fetch') }, async (url) => {
    const response = await fetch(`${url}/api/spotify/now-playing`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'disconnected' })
    assert.equal((await fetch(`${url}/api/spotify/top-tracks`, { method: 'POST' })).status, 405)
  })
})

test('concurrent now-playing requests share authorization and cache; only track metadata is public', async () => {
  let calls = 0
  await withApi(credentials, async (input) => {
    calls++
    return String(input).includes('/api/token')
      ? Response.json({ access_token: 'private-token', expires_in: 3600 })
      : Response.json({ item: track, is_playing: true, progress_ms: 1200, device: { name: 'Private device' } })
  }, async (url) => {
    const responses = await Promise.all(Array.from({ length: 4 }, () => fetch(`${url}/api/spotify/now-playing`)))
    const data = await responses[0].json() as { status: string; track: { title: string } }
    assert.equal(data.status, 'playing')
    assert.equal(data.track.title, 'Test song')
    assert.doesNotMatch(JSON.stringify(data), /private-token|Private device|secret|refresh/)
    assert.equal(calls, 2)
  })
})

test('no playback, episodes, and local tracks are idle', async () => {
  for (const item of [null, { ...track, type: 'episode' }, { ...track, is_local: true }]) {
    await withApi(credentials, async (input) => String(input).includes('/api/token')
      ? Response.json({ access_token: 'token', expires_in: 3600 })
      : item ? Response.json({ item }) : new Response(null, { status: 204 }), async (url) => {
      assert.deepEqual(await (await fetch(`${url}/api/spotify/now-playing`)).json(), { status: 'idle', track: null })
    })
  }
})

test('paused playback and top tracks preserve their own states', async () => {
  await withApi(credentials, async (input) => {
    if (String(input).includes('/api/token')) return Response.json({ access_token: 'token', expires_in: 3600 })
    return Response.json(String(input).includes('/top/') ? { items: [track] } : { item: track, is_playing: false })
  }, async (url) => {
    const now = await (await fetch(`${url}/api/spotify/now-playing`)).json() as { status: string }
    const top = await (await fetch(`${url}/api/spotify/top-tracks`)).json() as { tracks: unknown[] }
    assert.equal(now.status, 'paused')
    assert.equal(top.tracks.length, 1)
  })
})

test('expired authorization refreshes once; provider errors are sanitized and cached', async () => {
  let tokenCalls = 0
  let playbackCalls = 0
  await withApi(credentials, async (input) => {
    if (String(input).includes('/api/token')) { tokenCalls++; return Response.json({ access_token: 'token', expires_in: 3600 }) }
    playbackCalls++
    return new Response('sensitive provider error', { status: playbackCalls === 1 ? 401 : 429 })
  }, async (url) => {
    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${url}/api/spotify/now-playing`)
      assert.equal(response.status, 503)
      assert.deepEqual(await response.json(), { status: 'unavailable' })
    }
    assert.equal(tokenCalls, 2)
    assert.equal(playbackCalls, 2)
  })
})

test('GitHub returns only public, deduplicated commits and never sends authorization', async () => {
  let calls = 0
  await withApi({ GITHUB_USERNAME: 'rishi-vinod' }, async (input, options) => {
    calls++
    assert.match(String(input), /author%3Arishi-vinod/)
    assert.equal(new Headers(options?.headers).get('Authorization'), null)
    const commit = { sha: 'abc12345678', html_url: 'https://github.com/rishi-vinod/project/commit/abc12345678', repository: { private: false, full_name: 'rishi-vinod/project' }, commit: { message: 'Ship feature\nPrivate body omitted', committer: { date: '2026-10-28T12:00:00Z' } } }
    return Response.json({ items: [
      { ...commit, sha: 'private', repository: { private: true, full_name: 'private/project' } },
      commit, commit,
      { ...commit, sha: 'unknown', repository: { full_name: 'unknown/project' } },
    ], incomplete_results: false })
  }, async (url) => {
    const data = await (await fetch(`${url}/api/github/commits`)).json() as { commits: { sha: string; message: string }[] }
    assert.equal(data.commits.length, 1)
    assert.equal(data.commits[0].sha, 'abc1234')
    assert.equal(data.commits[0].message, 'Ship feature')
    await fetch(`${url}/api/github/commits`)
    assert.equal(calls, 1)
    const head = await fetch(`${url}/api/github/commits`, { method: 'HEAD' })
    assert.equal(head.status, 200)
    assert.equal(await head.text(), '')
  })
})

test('GitHub rate limits and invalid configuration do not leak provider errors', async () => {
  await withApi({}, async () => new Response('rate limit detail', { status: 403 }), async (url) => {
    const response = await fetch(`${url}/api/github/commits`)
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { status: 'unavailable' })
  })
  await withApi({ GITHUB_USERNAME: 'user repo:private' }, async () => { throw new Error('Must not fetch') }, async (url) => {
    assert.equal((await fetch(`${url}/api/github/commits`)).status, 503)
  })
})
