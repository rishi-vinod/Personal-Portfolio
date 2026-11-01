import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Screen } from '../hooks/useScreenTransition'

const groups: { label: string; items: Screen[] }[] = [
  { label: "ACCESS RISHI'S DATABASE", items: ['PROJECTS', 'RESUME', 'ABOUT'] },
  { label: 'OTHER ACTIONS', items: ['CONTACT'] },
]

export function TerminalMenu({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const triggers = useRef<(HTMLButtonElement | null)[]>([])
  const menus = useRef<(HTMLDivElement | null)[]>([])
  const focusItem = (group: number, index: number) => {
    const buttons = menus.current[group]?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
    if (buttons?.length) buttons[(index + buttons.length) % buttons.length].focus()
  }
  const openMenu = (group: number, last = false) => {
    setOpen(group)
    requestAnimationFrame(() => focusItem(group, last ? groups[group].items.length - 1 : 0))
  }
  const keyDown = (event: KeyboardEvent, group: number, index: number) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape']
    if (keys.includes(event.key)) event.preventDefault()
    if (event.key === 'ArrowDown') focusItem(group, index + 1)
    if (event.key === 'ArrowUp') focusItem(group, index - 1)
    if (event.key === 'Home') focusItem(group, 0)
    if (event.key === 'End') focusItem(group, groups[group].items.length - 1)
    if (event.key === 'Escape') { setOpen(null); triggers.current[group]?.focus() }
    if (event.key === 'Tab') {
      // Let native Tab/Shift+Tab continue from the trigger after closing.
      setOpen(null)
      triggers.current[group]?.focus()
    }
    if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
      const match = groups[group].items.findIndex((item) => item.startsWith(event.key.toUpperCase()))
      if (match >= 0) { event.preventDefault(); focusItem(group, match) }
    }
  }
  return <nav className="database-menu" aria-label="Database commands">
    {groups.map(({ label, items }, group) => <div className="command-group" key={label}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen((value) => value === group ? null : value)
      }}>
      <button className="menu-trigger" ref={(node) => { triggers.current[group] = node }}
        id={`command-${group}`} aria-haspopup="menu" aria-expanded={open === group}
        aria-controls={`menu-${group}`}
        onClick={() => open === group ? setOpen(null) : openMenu(group)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); openMenu(group, event.key === 'ArrowUp')
          }
          if (event.key === 'Escape') setOpen(null)
        }}>
        <span><span className="dim">0{group + 1} / </span>{label}</span>
        <span aria-hidden="true">{open === group ? '[-]' : '[+]'}</span>
      </button>
      <div role="menu" id={`menu-${group}`} aria-labelledby={`command-${group}`}
        hidden={open !== group} ref={(node) => { menus.current[group] = node }}>
        {items.map((item, index) => <button key={item} role="menuitem" tabIndex={-1}
          onKeyDown={(event) => keyDown(event, group, index)}
          onClick={() => onNavigate(item)}>
          <span aria-hidden="true">[0{index + 1}]</span> {item}<span className="record-arrow" aria-hidden="true">-&gt;</span>
        </button>)}
      </div>
    </div>)}
  </nav>
}
