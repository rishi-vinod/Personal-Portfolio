import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { createActivityApi } from './activity.ts'

const root = resolve(import.meta.dirname, '../dist')
const api = createActivityApi(process.env)
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
}

createServer((request, response) => {
  void api(request, response, () => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return
    }
    let pathname: string
    try { pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname) }
    catch { response.writeHead(400); response.end(); return }
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
    if (!file.startsWith(root + sep) || pathname.split('/').some((part) => part.startsWith('.'))) {
      response.writeHead(404); response.end(); return
    }
    void readFile(file).then((body) => {
      response.writeHead(200, {
        'Content-Type': types[extname(file)] ?? 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      })
      response.end(request.method === 'HEAD' ? undefined : body)
    }).catch(() => { response.writeHead(404); response.end('Not found') })
  })
}).listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1', () => {
  console.log(`Portfolio server: http://${process.env.HOST ?? '127.0.0.1'}:${process.env.PORT ?? 3000}`)
})
