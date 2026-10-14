import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineConfig({
  server: {
    host: '127.0.0.1',
    fs: {
      // Preserve Vite's default exclusions and block private local documents.
      deny: [
        '.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}',
        '.npmrc', '.yarnrc.yml', '**/.git/**', '**/.private/**',
      ],
    },
  },
  plugins: [react(), {
    name: 'local-resume',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== '/__local-resume.pdf') return next()

        const address = request.socket.remoteAddress
        const local = address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
        const host = request.headers.host
        const localHost = /^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host ?? '')
        const sameOrigin = !request.headers.origin || request.headers.origin === `http://${host}`
        response.setHeader('Cache-Control', 'no-store')
        response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
        response.setHeader('X-Content-Type-Options', 'nosniff')

        if (!local || !localHost || !sameOrigin || request.headers['sec-fetch-site'] === 'cross-site') {
          response.statusCode = 403
          return response.end('This document is available only in the local preview.')
        }
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          response.statusCode = 405
          response.setHeader('Allow', 'GET, HEAD')
          return response.end()
        }

        void readFile(resolve(import.meta.dirname, '.private/resume.pdf')).then((pdf) => {
          response.setHeader('Content-Type', 'application/pdf')
          response.setHeader('Content-Disposition', 'inline; filename="Resume.pdf"')
          response.setHeader('Content-Length', pdf.length)
          response.end(request.method === 'HEAD' ? undefined : pdf)
        }).catch(() => {
          response.statusCode = 404
          response.setHeader('Content-Type', 'text/plain; charset=utf-8')
          response.end('The resume is not available in this local preview.')
        })
      })
    },
  }],
})
