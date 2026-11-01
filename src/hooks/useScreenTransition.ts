import { useCallback, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

export type Screen = 'BOOT' | 'IDENTIFY' | 'GREETING' | 'MENU' | 'PROJECTS' | 'RESUME' | 'ABOUT' | 'CONTACT' | 'FAILED_ACCESS' | 'FAILED_PROJECTS'

export function useScreenTransition() {
  const [screen, setScreen] = useState<Screen>('BOOT')
  const [nextScreen, setNextScreen] = useState<Screen | null>(null)
  const locked = useRef(false)
  const reduced = useReducedMotion()
  const transitionTo = useCallback((next: Screen) => {
    if (locked.current || next === screen) return
    if (reduced) {
      setScreen(next)
      return
    }
    locked.current = true
    setNextScreen(next)
  }, [screen, reduced])
  const complete = useCallback(() => {
    if (nextScreen) setScreen(nextScreen)
    setNextScreen(null)
    locked.current = false
  }, [nextScreen])
  return { screen, nextScreen, transitionTo, complete }
}
