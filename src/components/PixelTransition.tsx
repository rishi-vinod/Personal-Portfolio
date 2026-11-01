import { useEffect, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

import type { Screen } from '../hooks/useScreenTransition'

// Both screens remain live DOM. Only the narrow seam is rasterized.
export function PixelTransition({ screen, nextScreen, complete, render }: {
  screen: Screen
  nextScreen: Screen | null
  complete: () => void
  render: (screen: Screen, active: boolean) => ReactNode
}) {
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const busy = nextScreen !== null

  useLayoutEffect(() => {
    if (busy) return
    const layer = host.current?.querySelector<HTMLElement>('[data-layer]')
    if (!layer) return
    layer.style.clipPath = ''
    layer.scrollTop = 0
    layer.querySelector<HTMLElement>('[data-screen-focus]')?.focus({ preventScroll: true })
  }, [screen, busy])

  useEffect(() => {
    if (!nextScreen) return
    const surface = canvas.current
    const layers = host.current?.querySelectorAll<HTMLElement>('[data-layer]')
    const context = surface?.getContext('2d')
    if (!surface || !layers || layers.length !== 2 || !context || reduced) {
      const frame = requestAnimationFrame(complete)
      return () => cancelAnimationFrame(frame)
    }
    const [oldLayer, newLayer] = layers
    let width = 0
    let height = 0
    let cell = 18
    let columns = 0
    let jitter: number[] = []
    let frame = 0
    const colors = getComputedStyle(host.current!)
    const green = colors.getPropertyValue('--green').trim()
    const dim = colors.getPropertyValue('--dim').trim()
    const background = colors.getPropertyValue('--background').trim()
    const resize = () => {
      width = host.current!.clientWidth
      height = host.current!.clientHeight
      // 18px on ordinary displays; increase on huge displays to cap the grid.
      cell = 18
      while (Math.ceil(width / cell) * Math.ceil(height / cell) > 5900) cell++
      columns = Math.ceil(width / cell)
      jitter = Array.from({ length: columns * Math.ceil(height / cell) }, () => Math.random())
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      surface.width = Math.round(width * ratio)
      surface.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.font = `${Math.floor(cell * .78)}px monospace`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(host.current!)
    // Freeze scrolling and all keyboard/pointer actions during the ripple.
    const block = (event: Event) => { event.preventDefault(); event.stopImmediatePropagation() }
    const blockedEvents = ['keydown', 'keyup', 'pointerdown', 'click', 'wheel', 'touchmove']
    blockedEvents.forEach((type) => window.addEventListener(type, block, { capture: true, passive: false }))
    const started = performance.now()
    const draw = (now: number) => {
      const progress = Math.min((now - started) / 1080, 1)
      const front = -cell * 4 + progress * (height + cell * 8)
      const seam: string[] = []
      context.clearRect(0, 0, width, height)
      for (let col = 0; col <= columns; col++) {
        const x = Math.min(col * cell, width)
        const y = front + Math.sin(col * .31 + progress * 5) * cell * .65
          + Math.sin(col * .11 - progress * 3) * cell * .4
        seam.push(`${x}px ${Math.max(0, Math.min(height, y))}px`)
        if (col === columns) continue
        const firstRow = Math.max(0, Math.floor(y / cell) - 1)
        const lastRow = Math.min(Math.ceil(height / cell) - 1, Math.floor(y / cell) + 1)
        for (let row = firstRow; row <= lastRow; row++) {
          const seed = jitter[row * columns + col]
          const tick = Math.floor((now - started + seed * 90) / (40 + seed * 35))
          context.fillStyle = background
          context.fillRect(x, row * cell, cell, cell)
          context.fillStyle = (tick + row + col) % 3 === 0 ? dim : green
          context.fillText((tick + Math.floor(seed * 10)) % 2 ? '1' : '0', x + cell / 2, row * cell + cell / 2)
        }
      }
      newLayer.style.clipPath = `polygon(0 0, 100% 0, ${[...seam].reverse().join(', ')})`
      oldLayer.style.clipPath = `polygon(${seam.join(', ')}, 100% 100%, 0 100%)`
      if (progress < 1) frame = requestAnimationFrame(draw)
      else complete()
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      blockedEvents.forEach((type) => window.removeEventListener(type, block, true))
      context.clearRect(0, 0, width, height)
      oldLayer.style.clipPath = ''
      newLayer.style.clipPath = ''
    }
  }, [nextScreen, complete, reduced])

  return <div ref={host} className="screen-host" aria-busy={busy}>
    {[screen, ...(nextScreen ? [nextScreen] : [])].map((value, index) =>
      <div key={value} data-layer className={index ? 'screen-layer incoming' : 'screen-layer'}
        inert={busy} aria-hidden={busy ? true : undefined}>
        {render(value, !busy)}
      </div>,
    )}
    {busy && <canvas className="pixel-seam" ref={canvas} aria-hidden="true" />}
    <span className="sr-only" role="status">{busy ? 'Loading record.' : ''}</span>
  </div>
}
