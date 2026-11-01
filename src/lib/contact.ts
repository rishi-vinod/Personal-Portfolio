export type ContactDraft = { name: string; email: string; message: string; honeypot: string }
export type ContactErrors = Partial<Record<'name' | 'email' | 'message', string>>
export const emptyContact: ContactDraft = { name: '', email: '', message: '', honeypot: '' }

export function validateContact(draft: ContactDraft): ContactErrors {
  const errors: ContactErrors = {}
  const name = draft.name.trim()
  const email = draft.email.trim()
  const message = draft.message.trim()
  if (!name || name.length > 80) errors.name = 'Enter a name of 1–80 characters.'
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid reply-to email address.'
  if (message.length < 10 || message.length > 3000) errors.message = 'Enter a message of 10–3,000 characters.'
  return errors
}

export async function deliverContact(endpoint: string, draft: ContactDraft, signal: AbortSignal, request = fetch) {
  // Never send visitor identity, recipient addresses, or any extra form fields.
  if (!contactEndpoint(endpoint) || draft.honeypot || Object.keys(validateContact(draft)).length) throw new Error('INVALID_MESSAGE')
  const response = await request(endpoint, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    redirect: 'error',
    signal,
    body: JSON.stringify({
      name: draft.name.trim(),
      email: draft.email.trim(),
      message: draft.message.trim(),
      _gotcha: '',
    }),
  })
  if (response.status === 429) throw new Error('RATE_LIMITED')
  if (!response.ok) throw new Error('TRANSMISSION_FAILED')
  const result: unknown = await response.json()
  if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
    throw new Error('TRANSMISSION_UNCONFIRMED')
  }
}
import { contactEndpoint } from './contactEndpoint.ts'

