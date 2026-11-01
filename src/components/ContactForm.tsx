import { useEffect, useRef, useState } from 'react'
import { contactEndpoint } from '../lib/contactEndpoint'
import { deliverContact, emptyContact, validateContact } from '../lib/contact'
import type { ContactDraft, ContactErrors } from '../lib/contact'

// Timestamp only; survives screen navigation in memory, never persisted.
let cooldownUntil = 0
const configuredEndpoint = contactEndpoint(import.meta.env.VITE_CONTACT_ENDPOINT)
type DeliveryStatus = 'IDLE' | 'TRANSMITTING' | 'SENT' | 'ERROR'

export function ContactForm({ active, endpoint = configuredEndpoint }: { active: boolean; endpoint?: string | null }) {
  const [draft, setDraft] = useState<ContactDraft>({ ...emptyContact })
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<DeliveryStatus>('IDLE')
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(() => Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)))
  const sending = useRef<AbortController | null>(null)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => setCooldown(Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])
  useEffect(() => () => {
    sending.current?.abort()
    sending.current = null
  }, [])
  const update = (key: keyof ContactDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    if (status === 'ERROR') { setStatus('IDLE'); setNotice('') }
  }
  const submit = async () => {
    if (!active || !endpoint || sending.current || Date.now() < cooldownUntil) return
    const validation = validateContact(draft)
    setErrors(validation)
    if (Object.keys(validation).length) {
      const first = Object.keys(validation)[0]
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    if (draft.honeypot) { setStatus('ERROR'); setNotice('Transmission rejected. Please try again.'); return }
    const controller = new AbortController()
    sending.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    setStatus('TRANSMITTING')
    setNotice('TRANSMITTING...')
    try {
      await deliverContact(endpoint, draft, controller.signal)
      if (sending.current !== controller) return
      cooldownUntil = Date.now() + 30000
      setCooldown(30)
      setStatus('SENT')
      setNotice('SENT / Your message has been accepted for delivery.')
      setDraft({ ...emptyContact })
    } catch (error) {
      if (sending.current !== controller) return
      setStatus('ERROR')
      setNotice(error instanceof Error && error.message === 'RATE_LIMITED'
        ? 'ERROR / Channel busy. Wait a minute before trying again.'
        : 'ERROR / Delivery could not be confirmed. Your draft is still here; check before retrying.')
    } finally {
      window.clearTimeout(timeout)
      if (sending.current === controller) sending.current = null
    }
  }
  return <>
    <p className="section-code">COMMUNICATIONS / OUTBOUND MESSAGE</p>
    <h1 data-screen-focus tabIndex={-1}>CONTACT</h1>
    <p className="channel-status">{endpoint ? 'CHANNEL READY / DIRECT CORRESPONDENCE' : 'CHANNEL OFFLINE'}</p>
    {!endpoint && <p className="instruction">Message delivery is not available yet. Please check back soon.</p>}
    <form className="contact-form" ref={form} noValidate onSubmit={(event) => { event.preventDefault(); void submit() }}>
      <fieldset disabled={!endpoint || status === 'TRANSMITTING'}>
        <label htmlFor="contact-name">NAME <span className="dim">/ REQUIRED</span></label>
        <input id="contact-name" name="name" required maxLength={80} autoComplete="name" value={draft.name}
          aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined}
          onChange={(event) => update('name', event.target.value)} />
        {errors.name && <p id="name-error" className="field-error">{errors.name}</p>}
        <label htmlFor="contact-email">REPLY-TO EMAIL <span className="dim">/ REQUIRED</span></label>
        <input id="contact-email" name="email" type="email" required maxLength={254} autoComplete="email" value={draft.email}
          aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined}
          onChange={(event) => update('email', event.target.value)} />
        {errors.email && <p id="email-error" className="field-error">{errors.email}</p>}
        <label htmlFor="contact-message">MESSAGE <span className="dim">/ REQUIRED</span></label>
        <textarea id="contact-message" name="message" required minLength={10} maxLength={3000} rows={7} value={draft.message}
          aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error message-count' : 'message-count'}
          onChange={(event) => update('message', event.target.value)} />
        <p id="message-count" className="instruction message-count">{draft.message.length} / 3,000 CHARACTERS</p>
        {errors.message && <p id="message-error" className="field-error">{errors.message}</p>}
        <div className="contact-honeypot" aria-hidden="true">
          <label htmlFor="contact-website">Leave this field empty</label>
          <input id="contact-website" name="_gotcha" tabIndex={-1} autoComplete="off" value={draft.honeypot}
            onChange={(event) => update('honeypot', event.target.value)} />
        </div>
        <button className="transmit-command" type="submit" disabled={cooldown > 0}>
          {status === 'TRANSMITTING' ? '[ TRANSMITTING ]' : cooldown > 0 ? `[ COOLDOWN / ${cooldown}s ]` : '[ TRANSMIT MESSAGE ]'}
        </button>
      </fieldset>
      <p className="delivery-status" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
      {endpoint && <p className="instruction contact-privacy">Your name, reply address, and message are sent to Formspree for delivery.</p>}
    </form>
  </>
}
