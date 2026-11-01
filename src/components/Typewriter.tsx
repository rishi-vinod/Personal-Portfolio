import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

export function Typewriter({ paragraphs, active, boot = false, onComplete }: {
  paragraphs: readonly string[]
  active: boolean
  boot?: boolean
  onComplete?: () => void
}) {
  const reduced = useReducedMotion()
  const [count, setCount] = useState(0)
  const [skipped, setSkipped] = useState(false)
  const total = paragraphs.reduce((sum, text) => sum + text.length, 0)
  const done = reduced || skipped || count >= total
  const callback = useRef(onComplete)
  useEffect(() => { callback.current = onComplete }, [onComplete])
  useEffect(() => {
    if (!active || done) return
    let boundary = 0
    const pause = count === 0 || paragraphs.some((text) => { boundary += text.length; return boundary === count })
    const timer = window.setTimeout(() => setCount((value) => value + 1), pause ? 520 : boot ? 32 : 12)
    return () => window.clearTimeout(timer)
  }, [active, done, count, paragraphs, boot])
  useEffect(() => {
    if (!active || !done) return
    const timer = window.setTimeout(() => callback.current?.(), skipped || reduced ? 0 : 450)
    return () => window.clearTimeout(timer)
  }, [active, done, skipped, reduced])
  useEffect(() => {
    if (!active || done) return
    const skip = (event: KeyboardEvent) => {
      if (!boot && event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      setSkipped(true)
    }
    window.addEventListener('keydown', skip, true)
    return () => window.removeEventListener('keydown', skip, true)
  }, [active, done, boot])
  return <div className="typewriter">
    <div className="sr-only">{paragraphs.map((text) => <p key={text}>{text}</p>)}</div>
    <div aria-hidden="true">
      {paragraphs.map((text, index) => {
        const offset = paragraphs.slice(0, index).reduce((sum, paragraph) => sum + paragraph.length, 0)
        const visible = done ? text : text.slice(0, Math.max(0, count - offset))
        const cursorHere = !done && count >= offset && count < offset + text.length
        return <p key={text} className={boot ? 'boot-line' : undefined}>
          {visible}{(cursorHere || (done && index === paragraphs.length - 1)) && <span className="cursor" />}
        </p>
      })}
    </div>
    {!done && <button className="skip-typing" onClick={() => setSkipped(true)}>SKIP <span aria-hidden="true">[ESC]</span></button>}
  </div>
}
