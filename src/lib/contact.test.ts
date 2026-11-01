import assert from 'node:assert/strict'
import test from 'node:test'
import { contactEndpoint } from './contactEndpoint.ts'
import { deliverContact, validateContact } from './contact.ts'

const endpoint = 'https://formspree.io/f/testform'
const message = { name: ' Visitor ', email: ' visitor@example.test ', message: ' A question about your hardware projects. ', honeypot: '' }

test('only public HTTPS form IDs are accepted as endpoint configuration', () => {
  assert.equal(contactEndpoint(' '), null)
  assert.equal(contactEndpoint(endpoint), endpoint)
  for (const value of [
    'http://formspree.io/f/testform', 'https://example.test/f/testform',
    'https://formspree.io/visitor@example.test', endpoint + '?token=fixture',
    'https://user:fixture@formspree.io/f/testform', endpoint + '#secret',
    'https://formspree.io/f/YOUR_FORM_ID',
  ]) assert.equal(contactEndpoint(value), null)
})

test('contact validation trims fields and enforces length and reply address boundaries', () => {
  assert.deepEqual(validateContact(message), {})
  assert.equal(Object.keys(validateContact({ name: ' ', email: 'bad', message: 'short', honeypot: '' })).length, 3)
  assert.ok(validateContact({ ...message, name: 'x'.repeat(81) }).name)
  assert.ok(validateContact({ ...message, email: 'a'.repeat(250) + '@example.test' }).email)
  assert.ok(validateContact({ ...message, message: 'x'.repeat(3001) }).message)
  assert.ok(validateContact({ ...message, email: 'x\r\n@example.test' }).email)
})

test('only explicitly allowed fields are transmitted; identity and recipient fields never leave', async () => {
  let requests = 0
  const draft = { ...message, identity: 'Recruiter', recipient: 'private@example.test' }
  const request: typeof fetch = async (url, options) => {
    requests++
    assert.equal(url, endpoint)
    assert.equal(options?.method, 'POST')
    assert.equal(options?.credentials, 'omit')
    assert.equal(options?.referrerPolicy, 'no-referrer')
    assert.deepEqual(JSON.parse(String(options?.body)), {
      name: 'Visitor', email: 'visitor@example.test',
      message: 'A question about your hardware projects.', _gotcha: '',
    })
    return Response.json({ ok: true })
  }
  await deliverContact(endpoint, draft, new AbortController().signal, request)
  assert.equal(requests, 1)
})

test('honeypot, invalid input, and unsafe endpoints never make a request', async () => {
  const request: typeof fetch = async () => { assert.fail('Unexpected network request') }
  for (const draft of [{ ...message, honeypot: 'bot' }, { ...message, email: 'invalid' }]) {
    await assert.rejects(deliverContact(endpoint, draft, new AbortController().signal, request), /INVALID_MESSAGE/)
  }
  await assert.rejects(deliverContact('https://example.test', message, new AbortController().signal, request), /INVALID_MESSAGE/)
})

test('rate limits, server errors, ambiguous responses, and network failure never report SENT', async () => {
  for (const [response, error] of [
    [new Response('', { status: 429 }), /RATE_LIMITED/],
    [new Response('', { status: 500 }), /TRANSMISSION_FAILED/],
    [Response.json({ ok: false }), /TRANSMISSION_UNCONFIRMED/],
    [Response.json({}), /TRANSMISSION_UNCONFIRMED/],
  ] as const) {
    await assert.rejects(deliverContact(endpoint, message, new AbortController().signal, async () => response), error)
  }
  await assert.rejects(deliverContact(endpoint, message, new AbortController().signal, async () => { throw new Error('Offline') }), /Offline/)
})
