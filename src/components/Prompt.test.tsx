import { StrictMode, type ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { charDelay, LEAD_MS, PAUSE_MS } from '../lib/typing'
import { SettingsProvider, useSettings } from '../lib/settings'
import { markPagesSeen } from '../test-utils'
import { AnimationProvider } from './AnimationProvider'
import { Prompt } from './Prompt'

const CHAR = charDelay(() => 1) // Math.random() = 1 -> the slowest delay
const CMD = 'neofetch'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(1)
  localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

function Es() {
  const { setLang } = useSettings()
  return <button onClick={() => setLang('es')}>es</button>
}

function ui({ start = true, onFinished, children = <p>body</p> }: { start?: boolean; onFinished?: (id: string) => void; children?: ReactNode } = {}) {
  return (
    <SettingsProvider>
      <AnimationProvider pageId="home">
        <Prompt id="x" command={CMD} user="adria" host="portfolio" start={start} onFinished={onFinished}>
          {children}
        </Prompt>
        <Es />
      </AnimationProvider>
    </SettingsProvider>
  )
}

const typed = (c: HTMLElement) =>
  c.querySelector('.prompt-line [aria-hidden="true"]')!.textContent!.replace(/^adria@portfolio:~\$ /, '')
const output = (c: HTMLElement) => c.querySelector('.prompt-output')!
const cursor = (c: HTMLElement) => c.querySelector('.prompt-cursor')
// act() flushes React updates only when it exits, so a timer that schedules the next one through
// a state change must get its own act(): advance 1 ms at a time to keep the fake clock exact.
const advance = (ms: number) => {
  for (let i = 0; i < ms; i++) act(() => void vi.advanceTimersByTime(1))
}

describe('Prompt', () => {
  it('shows the prompt line at once with an idle cursor and nothing typed', () => {
    const { container } = render(ui())
    expect(container.querySelector('#block-x.prompt-block')).toBeTruthy()
    expect(container.querySelector('.prompt-line .prompt-prefix')!.textContent).toBe('adria@portfolio:~$ ')
    expect(container.querySelector('.prompt-line .sr-only')!.textContent).toBe(CMD)
    expect(typed(container)).toBe('')
    expect(cursor(container)).toHaveAttribute('data-state', 'idle')
    expect(output(container)).toHaveAttribute('data-revealed', 'false')
    expect(output(container)).not.toHaveAttribute('data-animated')
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('never types while start is false, even after LEAD_MS', () => {
    const { container } = render(ui({ start: false }))
    advance(LEAD_MS * 5)
    expect(typed(container)).toBe('')
    expect(cursor(container)).toHaveAttribute('data-state', 'idle')
    expect(output(container)).toHaveAttribute('data-revealed', 'false')
  })

  it('with start true, begins typing only once LEAD_MS have passed since mount', () => {
    const { container } = render(ui())
    advance(LEAD_MS - 1)
    expect(cursor(container)).toHaveAttribute('data-state', 'idle')
    advance(1)
    expect(cursor(container)).toHaveAttribute('data-state', 'typing')
    expect(typed(container)).toBe('')
    advance(CHAR - 1)
    expect(typed(container)).toBe('')
    advance(1)
    expect(typed(container)).toBe('n')
  })

  it('types right away when start turns true after LEAD_MS', () => {
    const r = render(ui({ start: false }))
    advance(LEAD_MS * 3)
    r.rerender(ui({ start: true }))
    expect(cursor(r.container)).toHaveAttribute('data-state', 'typing')
    advance(CHAR)
    expect(typed(r.container)).toBe('n')
  })

  it('waits for the rest of LEAD_MS when start turns true early', () => {
    const r = render(ui({ start: false }))
    advance(LEAD_MS / 2)
    r.rerender(ui({ start: true }))
    expect(cursor(r.container)).toHaveAttribute('data-state', 'idle')
    advance(LEAD_MS / 2 - 1)
    expect(cursor(r.container)).toHaveAttribute('data-state', 'idle')
    advance(1 + CHAR)
    expect(typed(r.container)).toBe('n')
  })

  it('grows one character at a time, pauses, reveals with data-animated and finishes exactly once', () => {
    const onFinished = vi.fn()
    const { container } = render(ui({ onFinished }))
    advance(LEAD_MS)
    for (let i = 1; i <= CMD.length; i++) {
      advance(CHAR)
      expect(typed(container)).toBe(CMD.slice(0, i))
    }
    expect(output(container)).toHaveAttribute('data-revealed', 'false')
    expect(cursor(container)).toHaveAttribute('data-state', 'typing')
    advance(PAUSE_MS - 1)
    expect(output(container)).toHaveAttribute('data-revealed', 'false')
    expect(onFinished).not.toHaveBeenCalled()
    advance(1)
    expect(output(container)).toHaveAttribute('data-revealed', 'true')
    expect(output(container)).toHaveAttribute('data-animated', 'true')
    expect(cursor(container)).toBeNull()
    expect(onFinished).toHaveBeenCalledTimes(1)
    expect(onFinished).toHaveBeenCalledWith('x')
    advance(10_000)
    expect(onFinished).toHaveBeenCalledTimes(1)
    expect(typed(container)).toBe(CMD)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('under StrictMode runs a single timer chain with exact text and one finish', () => {
    const onFinished = vi.fn()
    const { container } = render(<StrictMode>{ui({ onFinished })}</StrictMode>)
    let prev = ''
    let sawMid = false
    for (let t = 0; t < LEAD_MS + CHAR * CMD.length + PAUSE_MS + 500; t += 5) {
      advance(5)
      const cur = typed(container)
      expect(cur.startsWith(prev)).toBe(true)
      expect(CMD.startsWith(cur)).toBe(true)
      prev = cur
      if (cur.length > 0 && cur.length < CMD.length) {
        sawMid = true
        expect(vi.getTimerCount()).toBe(1)
      }
    }
    expect(sawMid).toBe(true)
    expect(typed(container)).toBe(CMD)
    expect(output(container)).toHaveAttribute('data-revealed', 'true')
    expect(vi.getTimerCount()).toBe(0)
    expect(onFinished).toHaveBeenCalledTimes(1)
  })

  it('a language switch mid-typing changes nothing', () => {
    const { container } = render(ui())
    advance(LEAD_MS + CHAR * 3)
    expect(typed(container)).toBe('neo')
    fireEvent.click(screen.getByText('es'))
    expect(typed(container)).toBe('neo')
    advance(CHAR)
    expect(typed(container)).toBe('neof')
    advance(CHAR * 4 + PAUSE_MS)
    expect(typed(container)).toBe(CMD)
    expect(output(container)).toHaveAttribute('data-revealed', 'true')
  })

  it('unmounting mid-typing clears every timer without warnings', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onFinished = vi.fn()
    const { unmount } = render(ui({ onFinished }))
    advance(LEAD_MS + CHAR * 2)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    advance(10_000)
    expect(err).not.toHaveBeenCalled()
    expect(onFinished).not.toHaveBeenCalled()
  })

  it('unmounting during the lead clears its timer', () => {
    const { unmount } = render(ui())
    advance(LEAD_MS / 2)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shows everything at once without a cursor or finish when animate is false', () => {
    markPagesSeen('home')
    const onFinished = vi.fn()
    const { container } = render(ui({ onFinished }))
    expect(typed(container)).toBe(CMD)
    expect(cursor(container)).toBeNull()
    expect(output(container)).toHaveAttribute('data-revealed', 'true')
    expect(output(container)).not.toHaveAttribute('data-animated')
    expect(vi.getTimerCount()).toBe(0)
    advance(10_000)
    expect(onFinished).not.toHaveBeenCalled()
  })

  it('keeps the unrevealed output inert while idle, in the lead and while typing, and not after the reveal', () => {
    const { container } = render(ui())
    expect(output(container)).toHaveAttribute('inert')
    advance(LEAD_MS / 2)
    expect(output(container)).toHaveAttribute('inert')
    advance(LEAD_MS / 2 + CHAR * 3)
    expect(cursor(container)).toHaveAttribute('data-state', 'typing')
    expect(output(container)).toHaveAttribute('inert')
    advance(CHAR * 5 + PAUSE_MS - 1)
    expect(output(container)).toHaveAttribute('data-revealed', 'false')
    expect(output(container)).toHaveAttribute('inert')
    advance(1)
    expect(output(container)).toHaveAttribute('data-revealed', 'true')
    expect(output(container)).not.toHaveAttribute('inert')
  })

  it('keeps the output inert while start is false', () => {
    const { container } = render(ui({ start: false }))
    advance(LEAD_MS * 3)
    expect(output(container)).toHaveAttribute('inert')
  })

  it('never sets inert when animate is false', () => {
    markPagesSeen('home')
    const { container } = render(ui())
    expect(output(container)).not.toHaveAttribute('inert')
  })

  // jsdom and user-event ignore `inert` for focus (jsdom focusing.js TODOs; user-event's focusable
  // selector), so Tab order cannot be checked here: assert the focusable content sits under an inert
  // ancestor until the reveal (browsers then skip it for Tab, find-in-page and the accessibility tree).
  it('puts focusable content of the unrevealed output under an inert ancestor, and frees it on reveal', () => {
    render(ui({ children: <button>inside</button> }))
    expect(screen.getByText('inside').closest('[inert]')).not.toBeNull()
    advance(LEAD_MS + CHAR * CMD.length + PAUSE_MS)
    expect(screen.getByText('inside').closest('[inert]')).toBeNull()
  })
})
