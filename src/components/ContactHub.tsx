import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useActivity } from '../hooks/useActivity'
import { BotCheck } from './BotCheck'
import './ContactHub.css'

type Answer = { matched: boolean; title: string; answer: string; links: { label: string; url: string }[] }
type DeliveryConfig = { enabled: boolean; siteKey: string | null }

async function post<T>(path: string, data: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal,
  })
  const result = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(result.error ?? 'Something went wrong. Please try again.')
  return result
}

export function ContactHub() {
  const [mode, setMode] = useState<'message' | 'faq'>('message')
  const [draft, setDraft] = useState({ name: '', email: '', message: '', website: '' })
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [answeredQuestion, setAnsweredQuestion] = useState('')
  const [token, setToken] = useState('')
  const [checkVersion, setCheckVersion] = useState(0)
  const [sending, setSending] = useState(false)
  const [asking, setAsking] = useState(false)
  const [messageStatus, setMessageStatus] = useState<{ error: boolean; text: string } | null>(null)
  const [questionError, setQuestionError] = useState('')
  const requestId = useRef('')
  const sendController = useRef<AbortController | null>(null)
  const askController = useRef<AbortController | null>(null)
  const config = useActivity<DeliveryConfig>('api/contact', 300_000)
  const suggestions = useActivity<{ suggestions: string[] }>('api/resume/questions', 300_000)
  useEffect(() => () => { sendController.current?.abort(); askController.current?.abort() }, [])

  function switchMode(next: 'message' | 'faq') {
    if (next !== mode) setToken('')
    setMode(next)
  }

  function updateDraft(key: keyof typeof draft, value: string) {
    setDraft((previous) => ({ ...previous, [key]: value }))
    requestId.current = ''
    setMessageStatus(null)
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sendController.current || !config.data?.enabled || !token) return
    const controller = new AbortController()
    sendController.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 25_000)
    setSending(true); setMessageStatus(null)
    requestId.current ||= crypto.randomUUID()
    try {
      const result = await post<{ message: string }>('api/contact', { ...draft, token, requestId: requestId.current }, controller.signal)
      setMessageStatus({ error: false, text: result.message })
      setDraft({ name: '', email: '', message: '', website: '' })
      requestId.current = ''
    } catch (error) {
      setMessageStatus({ error: true, text: controller.signal.aborted ? 'We couldn’t confirm delivery. You can retry this message after a fresh bot check.' : error instanceof Error ? error.message : 'Please try again later.' })
    } finally {
      window.clearTimeout(timeout); sendController.current = null; setSending(false)
      setToken(''); setCheckVersion((value) => value + 1)
    }
  }

  async function askQuestion(value: string) {
    if (askController.current || value.trim().length < 2) return
    const controller = new AbortController()
    askController.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 12_000)
    setAsking(true); setQuestionError(''); setQuestion(value); setAnswer(null)
    try {
      const result = await post<Answer>('api/resume/questions', { question: value }, controller.signal)
      setAnsweredQuestion(value); setAnswer(result)
    } catch (error) {
      setQuestionError(controller.signal.aborted ? 'That took too long. Please try again.' : error instanceof Error ? error.message : 'Please try again later.')
    } finally { window.clearTimeout(timeout); askController.current = null; setAsking(false) }
  }

  return <div className="contact-hub">
    <div className="contact-modes" aria-label="Ways to connect">
      <button type="button" aria-pressed={mode === 'message'} aria-controls="message-panel" onClick={() => switchMode('message')}><span aria-hidden="true">↗</span> Send a message</button>
      <button type="button" aria-pressed={mode === 'faq'} aria-controls="faq-panel" onClick={() => switchMode('faq')}><span aria-hidden="true">?</span> Ask about my background</button>
    </div>

    <div id="message-panel" hidden={mode !== 'message'}>
      <p className="hub-intro">An idea, a question, or just a hello.</p>
      {config.loading ? <p className="form-notice" role="status">Checking the message form…</p> : (!config.data?.enabled || config.error) && <p className="form-notice">The message form isn’t available yet. Reach me on <a href="https://www.linkedin.com/in/rishi-vinod/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a> in the meantime.</p>}
      <form onSubmit={(event) => void sendMessage(event)}>
        <fieldset disabled={sending} className="message-fields">
          <div className="contact-field-row">
            <label htmlFor="visitor-name">Your name<input id="visitor-name" name="name" autoComplete="name" maxLength={80} required value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="Alex Morgan" /></label>
            <label htmlFor="visitor-email">Your email<input id="visitor-email" name="email" type="email" autoComplete="email" maxLength={254} required value={draft.email} onChange={(event) => updateDraft('email', event.target.value)} placeholder="alex@example.com" /></label>
          </div>
          <label htmlFor="visitor-message">What’s on your mind?<textarea id="visitor-message" name="message" minLength={10} maxLength={3000} rows={4} required value={draft.message} onChange={(event) => updateDraft('message', event.target.value)} placeholder="I’d love to talk about…" /></label>
          <div className="form-trap" aria-hidden="true"><label>Leave this empty<input name="website" autoComplete="off" tabIndex={-1} value={draft.website} onChange={(event) => updateDraft('website', event.target.value)} /></label></div>
          <div className="message-meta"><span>Only used to read and reply to your message.</span><span>{draft.message.length}/3000</span></div>
        </fieldset>
        {config.data?.enabled && config.data.siteKey && mode === 'message' && <BotCheck key={checkVersion} siteKey={config.data.siteKey} onToken={setToken} />}
        <div className="contact-submit-row"><button className="primary-link" type="submit" disabled={sending || !config.data?.enabled || !token}>{sending ? 'Sending…' : 'Send message'} <span aria-hidden="true">↗</span></button><span className="delivery-note">{config.data?.enabled ? 'Bot check by Cloudflare. Email via Resend.' : 'Email delivery coming soon.'}</span></div>
        <div aria-live="polite" aria-atomic="true">{messageStatus && <p className={`form-notice ${messageStatus.error ? 'is-error' : 'is-success'}`}>{messageStatus.text}</p>}</div>
      </form>
    </div>

    <div id="faq-panel" hidden={mode !== 'faq'}>
      <p className="hub-intro">A quick introduction, straight from my résumé.</p>
      <p className="faq-explainer">Short, prepared answers about my studies and work. For anything else, send me a message.</p>
      <div className="question-suggestions">{(suggestions.data?.suggestions ?? ['What is Rishi studying?', 'What are Rishi’s technical skills?', 'What projects has Rishi built?', 'What leadership experience does Rishi have?']).map((suggestion) => <button key={suggestion} type="button" disabled={asking} onClick={() => void askQuestion(suggestion)}>{suggestion} <span aria-hidden="true">↗</span></button>)}</div>
      <form className="question-form" onSubmit={(event) => { event.preventDefault(); void askQuestion(question) }}>
        <label htmlFor="resume-question">Your question</label>
        <div className="question-input-row"><input id="resume-question" name="question" maxLength={300} minLength={2} required value={question} disabled={asking} onChange={(event) => setQuestion(event.target.value)} placeholder="Tell me about the Raspberry Pi project" /><button type="submit" className="ask-button" disabled={asking || question.trim().length < 2}>{asking ? 'Looking…' : 'Ask'} <span aria-hidden="true">→</span></button></div>
      </form>
      <div className="answer-region" aria-live="polite" aria-busy={asking}>
        {questionError && <p className="form-notice is-error">{questionError}</p>}
        {answer && <article className="resume-answer"><span className="answer-label">{answer.matched ? 'From my résumé' : 'Beyond the FAQ'}</span><h3>{answer.title}</h3><p className="answered-question">{answeredQuestion}</p><p>{answer.answer}</p>{answer.links.map((link) => <a className="text-link" key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} <span aria-hidden="true">↗</span></a>)}{!answer.matched && <button type="button" className="text-link" onClick={() => setMode('message')}>Send a message <span aria-hidden="true">→</span></button>}</article>}
      </div>
    </div>
  </div>
}
