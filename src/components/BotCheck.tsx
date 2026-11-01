import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string
      remove: (id: string) => void
    }
  }
}

export function BotCheck({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let widget: string | undefined
    let disposed = false
    const ready = () => {
      if (disposed || !container.current || !window.turnstile || widget) return
      try {
        widget = window.turnstile.render(container.current, {
          sitekey: siteKey, theme: 'dark', size: 'flexible', action: 'contact',
          callback: (token: string) => { setError(false); onToken(token) },
          'expired-callback': () => onToken(''),
          'error-callback': () => { onToken(''); setError(true) },
        })
      } catch { setError(true) }
    }
    const failed = () => { if (!disposed) setError(true) }
    let script = document.querySelector<HTMLScriptElement>('#turnstile-script')
    const isNew = !script
    if (!script) {
      script = document.createElement('script')
      script.id = 'turnstile-script'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
    }
    script.addEventListener('load', ready)
    script.addEventListener('error', failed)
    if (isNew) document.head.append(script)
    if (window.turnstile) ready()
    const timeout = window.setTimeout(() => { if (!widget) failed() }, 15_000)
    return () => {
      disposed = true; window.clearTimeout(timeout)
      script.removeEventListener('load', ready); script.removeEventListener('error', failed)
      if (widget) window.turnstile?.remove(widget)
    }
  }, [siteKey, onToken])
  return <div className="bot-check"><div ref={container} />{error && <p role="alert">The bot check couldn’t load. Please refresh or use LinkedIn below.</p>}</div>
}
