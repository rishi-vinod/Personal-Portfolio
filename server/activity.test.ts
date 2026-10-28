import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createActivityApi } from './activity.ts'

async function withApi(env: Record<string, string>, upstream: typeof fetch, check: (url: string) => Promise<void>) {
  const api = createActivityApi(env, upstream)
  const server = createServer((req, res) => { void api(req, res, () => { res.writeHead(404); res.end() }) })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  try { await check(`http://127.0.0.1:${address.port}`) }
  finally { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())) }
}

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
    assert.equal((await fetch(`${url}/api/github/commits`, { method: 'POST' })).status, 405)
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
