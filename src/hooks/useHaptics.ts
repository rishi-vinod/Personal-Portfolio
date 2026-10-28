import { useEffect, useState } from 'react'

export function useHaptics() {
  const supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    if (!supported || !enabled) return
    const feedback = (event: MouseEvent) => {
      if (!event.isTrusted || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (event.target instanceof Element && event.target.closest('a, button')) {
        try { navigator.vibrate(8) } catch { /* Unsupported devices retain visual feedback. */ }
      }
    }
    document.addEventListener('click', feedback)
    return () => document.removeEventListener('click', feedback)
  }, [enabled, supported])
  return { supported, enabled, toggle: () => setEnabled((value) => !value) }
}
