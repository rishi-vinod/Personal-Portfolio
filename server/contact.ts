import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { answerResumeQuestion, faqSuggestions } from './resume-faq.ts'

type Environment = Record<string, string | undefined>
class RequestError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new RequestError(415, 'Please send JSON.')
  }
  if (Number(request.headers['content-length'] ?? 0) > 16_384) throw new RequestError(413, 'That message is too large.')
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let length = 0
    const cleanup = () => {
      clearTimeout(timer)
      request.off('data', onData); request.off('end', onEnd); request.off('error', onError); request.off('aborted', onAborted)
    }
    const fail = (error: Error) => { cleanup(); request.resume(); reject(error) }
    const onData = (chunk: Buffer) => {
      length += chunk.length
      if (length > 16_384) { fail(new RequestError(413, 'That message is too large.')); return }
      chunks.push(chunk)
    }
    const onError = () => fail(new RequestError(400, 'The request could not be read.'))
    const onAborted = () => fail(new RequestError(400, 'The request was interrupted.'))
    const onEnd = () => {
      cleanup()
      try {
        const data: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error()
        resolve(data as Record<string, unknown>)
      } catch { reject(new RequestError(400, 'Please send a valid form.')) }
    }
    const timer = setTimeout(() => fail(new RequestError(408, 'The request took too long.')), 10_000)
    request.on('data', onData); request.on('end', onEnd); request.on('error', onError); request.on('aborted', onAborted)
  })
}

function field(data: Record<string, unknown>, name: string, min: number, max: number) {
  const value = data[name]
  if (typeof value !== 'string' || value.trim().length < min || value.length > max || value.includes(String.fromCharCode(0))) {
    throw new RequestError(400, `Please check the ${name} field.`)
  }
  return value.trim()
}
const validEmail = (value: string) => value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)

export function createContactApi(env: Environment, fetcher: typeof fetch = fetch) {
  // Bounded, per-process buckets. Use a shared edge limiter when deploying multiple instances.
  const buckets = new Map<string, { count: number; expires: number }>()
  function limit(key: string, max: number, windowMs: number) {
    const now = Date.now()
    for (const [id, bucket] of buckets) if (bucket.expires <= now) buckets.delete(id)
    const bucket = buckets.get(key) ?? { count: 0, expires: now + windowMs }
    if (bucket.count >= max || (!buckets.has(key) && buckets.size >= 10_000)) {
      throw new RequestError(429, 'Too many requests. Please try again later.')
    }
    bucket.count++; buckets.set(key, bucket)
  }
  const enabled = Boolean(env.RESEND_API_KEY && validEmail(env.CONTACT_TO_EMAIL ?? '') && validEmail(env.CONTACT_FROM_EMAIL ?? '') && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.SITE_ORIGIN)

  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const path = request.url?.split('?')[0]
    if (path !== '/api/contact' && path !== '/api/resume/questions') return next()
    const isContact = path === '/api/contact'
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    const send = (status: number, data: unknown) => { response.statusCode = status; response.end(request.method === 'HEAD' ? undefined : JSON.stringify(data)) }
    if (request.method === 'GET' || request.method === 'HEAD') {
      send(200, isContact ? { enabled, siteKey: enabled ? env.TURNSTILE_SITE_KEY : null } : { suggestions: faqSuggestions })
      return
    }
    if (request.method !== 'POST') { response.setHeader('Allow', 'GET, HEAD, POST'); send(405, { error: 'Method not allowed.' }); return }
    try {
      const origin = request.headers.origin
      const localOrigin = `http://${request.headers.host}`
      const expectedOrigin = env.SITE_ORIGIN || localOrigin
      if ((origin && origin !== expectedOrigin) || request.headers['sec-fetch-site'] === 'cross-site') {
        throw new RequestError(403, 'Please use the form on this website.')
      }
      let ip = request.socket.remoteAddress ?? 'unknown'
      // Enable only behind one trusted proxy that overwrites/appends X-Forwarded-For.
      if (env.TRUST_PROXY === '1') {
        const forwarded = request.headers['x-forwarded-for']
        const candidate = typeof forwarded === 'string' ? forwarded.split(',').at(-1)?.trim() : undefined
        if (candidate && isIP(candidate)) ip = candidate
      }
      limit(`${path}:${ip}`, isContact ? 5 : 30, isContact ? 900_000 : 60_000)
      const data = await readJson(request)
      if (!isContact) { send(200, answerResumeQuestion(field(data, 'question', 2, 300))); return }
      if (!enabled) throw new RequestError(503, 'Messages are temporarily unavailable. Please use LinkedIn below.')
      if (data.website !== undefined && data.website !== '') throw new RequestError(400, 'Unable to accept this message.')
      const name = field(data, 'name', 1, 80)
      const email = field(data, 'email', 3, 254).toLowerCase()
      const message = field(data, 'message', 10, 3000)
      const token = field(data, 'token', 1, 2048)
      const requestId = field(data, 'requestId', 36, 36)
      if (!validEmail(email) || /[\r\n]/.test(name) || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(requestId)) {
        throw new RequestError(400, 'Please check your name and email, then try again.')
      }
      limit('contact:global-attempts', 100, 3_600_000)
      const verification = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
      })
      if (!verification.ok) throw new RequestError(503, 'The bot check is unavailable. Please try again later.')
      const challenge = await verification.json() as { success: boolean; hostname: string; action: string }
      if (!challenge.success || challenge.hostname !== new URL(expectedOrigin).hostname || challenge.action !== 'contact') {
        throw new RequestError(400, 'Please complete a fresh bot check and try again.')
      }
      const emailHash = createHash('sha256').update(email).digest('hex')
      limit(`email:${emailHash}`, 3, 3_600_000)
      limit('contact:global-sends', 50, 3_600_000)
      const delivery = await fetcher('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10_000),
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json',
          'Idempotency-Key': `portfolio/${createHash('sha256').update(JSON.stringify([requestId, name, email, message])).digest('hex')}`,
        },
        body: JSON.stringify({
          from: env.CONTACT_FROM_EMAIL, to: [env.CONTACT_TO_EMAIL], reply_to: email,
          subject: 'New portfolio message', text: `From: ${name}\nReply to: ${email}\n\n${message}`,
        }),
      })
      if (!delivery.ok) throw new RequestError(503, 'We couldn’t confirm your message. Please retry or use LinkedIn below.')
      const receipt = await delivery.json() as { id?: string }
      if (!receipt.id) throw new RequestError(503, 'We couldn’t confirm your message. Please try again later.')
      send(202, { status: 'accepted', message: 'Your message is on its way. Thanks for reaching out.' })
    } catch (error) {
      if (error instanceof RequestError) {
        if (error.status === 429) response.setHeader('Retry-After', isContact ? '3600' : '60')
        send(error.status, { error: error.message })
      } else send(503, { error: 'This service is temporarily unavailable. Please try again later.' })
    }
  }
}
