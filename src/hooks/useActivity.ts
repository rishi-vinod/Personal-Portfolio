import { useEffect, useState } from 'react'

export function useActivity<T>(path: string, interval: number) {
  const [result, setResult] = useState<{ data: T | null; loading: boolean; error: boolean }>({ data: null, loading: true, error: false })
  useEffect(() => {
    let disposed = false
    let controller: AbortController | undefined
    const refresh = async () => {
      if (document.hidden || controller) return
      controller = new AbortController()
      const timeout = window.setTimeout(() => controller?.abort(), 20_000)
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}${path}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Activity unavailable')
        const data = await response.json() as T
        if (!disposed) setResult({ data, loading: false, error: false })
      } catch {
        if (!disposed) setResult({ data: null, loading: false, error: true })
      } finally { window.clearTimeout(timeout); controller = undefined }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), interval)
    const onVisible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      disposed = true; controller?.abort(); window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [path, interval])
  return result
}
