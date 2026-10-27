import { StrictMode } from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { charDelay, GAP_MS, LEAD_MS, PAUSE_MS } from '../lib/typing'
import { SettingsProvider, useSettings } from '../lib/settings'
import { markPagesSeen } from '../test-utils'
import { AnimationProvider } from './AnimationProvider'
import { Sequence } from './Sequence'

const CHAR = charDelay(() => 1) // Math.random() = 1 -> the slowest delay
const RUN = LEAD_MS + 2 * CHAR + PAUSE_MS // one 2-character command, from mount to reveal

type Step = { id: string; command: string; content: React.ReactNode }
const mk = (...ids: string[]): Step[] => ids.map((id) => ({ id, command: id + id, content: <p>content-{id}</p> }))

// --- controllable layout -------------------------------------------------
let tops: Record<string, number> = {}
let viewport = { innerHeight: 900, scrollY: 0, scrollHeight: 5000 }
const saved: Record<string, PropertyDescriptor | undefined> = {}
let observers: { cb: () => void; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = []

function stubLayout() {
  tops = {}
  viewport = { innerHeight: 900, scrollY: 0, scrollHeight: 5000 }
  for (const k of ['innerHeight', 'scrollY'] as const) {
    saved[k] = Object.getOwnPropertyDescriptor(window, k)
    Object.defineProperty(window, k, { configurable: true, get: () => viewport[k] })
  }
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, get: () => viewport.scrollHeight })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const id = this.querySelector('.prompt-block')?.id.replace(/^block-/, '') ?? ''
    const top = tops[id] ?? 0
    return { top, bottom: top + 100, left: 0, right: 0, width: 0, height: 100, x: 0, y: top, toJSON() {} } as DOMRect
  })
  observers = []
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve() {}
      constructor(cb: () => void) {
        observers.push({ cb, observe: this.observe, disconnect: this.disconnect })
      }
    },
  )
}
function restoreLayout() {
  for (const k of ['innerHeight', 'scrollY'] as const) {
    if (saved[k]) Object.defineProperty(window, k, saved[k]!)
  }
  delete (document.documentElement as unknown as Record<string, unknown>).scrollHeight
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(1)
  localStorage.clear()
  stubLayout()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  restoreLayout()
  localStorage.clear()
})

function Es() {
  const { setLang } = useSettings()
  return <button onClick={() => setLang('es')}>es</button>
}

function ui(steps: Step[], scrollGated?: boolean) {
  return (
    <SettingsProvider>
      <AnimationProvider pageId="home">
        <Sequence steps={steps} user="u" host="h" scrollGated={scrollGated} />
        <Es />
      </AnimationProvider>
    </SettingsProvider>
  )
}

// act() flushes React updates only when it exits, so a timer that schedules the next one through
// a state change must get its own act(): advance 1 ms at a time to keep the fake clock exact.
const advance = (ms: number) => {
  for (let i = 0; i < ms; i++) act(() => void vi.advanceTimersByTime(1))
}
// event-driven: fire exactly one pending timer per act() (React commits between callbacks), until none is left.
const drain = (each: () => void, max = 1000) => {
  let n = 0
  while (vi.getTimerCount() > 0) {
    if (++n > max) throw new Error('timers never settled')
    act(() => void vi.advanceTimersToNextTimer())
    each()
  }
  return n
}
const ids = (c: HTMLElement) => [...c.querySelectorAll('.prompt-block')].map((b) => b.id.replace(/^block-/, ''))
const block = (c: HTMLElement, id: string) => c.querySelector(`#block-${id}`)
const typed = (c: HTMLElement, id: string) =>
  block(c, id)!.querySelector('.prompt-line [aria-hidden="true"]')!.textContent!.replace(/^u@h:~\$ /, '')
const cursorState = (c: HTMLElement, id: string) => block(c, id)!.querySelector('.prompt-cursor')?.getAttribute('data-state') ?? null
const revealed = (c: HTMLElement, id: string) => block(c, id)!.querySelector('.prompt-output')!.getAttribute('data-revealed')
const scroll = () => act(() => void fireEvent.scroll(window))

describe('Sequence', () => {
  it('renders only the first prompt at load, each wrapped in a sequence-step', () => {
    const { container } = render(ui(mk('a', 'b', 'c')))
    expect(ids(container)).toEqual(['a'])
    expect(container.querySelectorAll('.sequence-step')).toHaveLength(1)
    expect(container.querySelector('.sequence-step > #block-a')).toBeTruthy()
  })

  it('adds the next prompt only after the previous output is revealed plus GAP_MS', () => {
    const { container } = render(ui(mk('a', 'b', 'c')))
    advance(RUN - 1)
    expect(revealed(container, 'a')).toBe('false')
    advance(1)
    expect(revealed(container, 'a')).toBe('true')
    expect(ids(container)).toEqual(['a'])
    advance(GAP_MS - 1)
    expect(ids(container)).toEqual(['a'])
    advance(1)
    expect(ids(container)).toEqual(['a', 'b'])
    expect(cursorState(container, 'b')).toBe('idle')
    expect(typed(container, 'b')).toBe('')
    advance(RUN + GAP_MS)
    expect(ids(container)).toEqual(['a', 'b', 'c'])
    advance(RUN)
    expect(['a', 'b', 'c'].map((id) => typed(container, id))).toEqual(['aa', 'bb', 'cc'])
    expect(['a', 'b', 'c'].map((id) => revealed(container, id))).toEqual(['true', 'true', 'true'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('runs in order under StrictMode with exact text', () => {
    const { container } = render(<StrictMode>{ui(mk('a', 'b', 'c'))}</StrictMode>)
    advance(RUN + GAP_MS)
    expect(ids(container)).toEqual(['a', 'b'])
    advance(RUN + GAP_MS + RUN)
    expect(ids(container)).toEqual(['a', 'b', 'c'])
    expect(['a', 'b', 'c'].map((id) => typed(container, id))).toEqual(['aa', 'bb', 'cc'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shows every step at once when animate is false', () => {
    markPagesSeen('home')
    const { container } = render(ui(mk('a', 'b', 'c')))
    expect(ids(container)).toEqual(['a', 'b', 'c'])
    expect(container.querySelectorAll('.sequence-step')).toHaveLength(3)
    expect(container.querySelector('.prompt-cursor')).toBeNull()
    expect(['a', 'b', 'c'].map((id) => revealed(container, id))).toEqual(['true', 'true', 'true'])
  })

  it('shows every step at once when animate is false, even scroll-gated', () => {
    markPagesSeen('home')
    tops = { b: 5000, c: 6000 }
    const { container } = render(ui(mk('a', 'b', 'c'), true))
    expect(ids(container)).toEqual(['a', 'b', 'c'])
    expect(['a', 'b', 'c'].map((id) => typed(container, id))).toEqual(['aa', 'bb', 'cc'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('renders nothing for an empty step list', () => {
    const { container } = render(ui([]))
    expect(container.querySelector('.sequence-step')).toBeNull()
    advance(10_000)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('survives a step list that shrinks or empties', () => {
    const r = render(ui(mk('a', 'b', 'c')))
    advance(RUN + GAP_MS)
    expect(ids(r.container)).toEqual(['a', 'b'])
    r.rerender(ui(mk('a')))
    expect(ids(r.container)).toEqual(['a'])
    advance(10_000)
    expect(ids(r.container)).toEqual(['a'])
    r.rerender(ui([]))
    expect(ids(r.container)).toEqual([])
    advance(10_000)
  })

  it('unmounting mid-gap leaves no timers', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = render(ui(mk('a', 'b')))
    advance(RUN + GAP_MS / 2)
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    advance(10_000)
    expect(err).not.toHaveBeenCalled()
  })

  it('ungated (default) starts every prompt as soon as it appears, wherever it is', () => {
    tops = { a: 3000, b: 5000 }
    const { container } = render(ui(mk('a', 'b')))
    advance(RUN + GAP_MS + LEAD_MS + CHAR)
    expect(typed(container, 'b')).toBe('b')
  })

  it('does not attach scroll listeners when ungated', () => {
    const add = vi.spyOn(window, 'addEventListener')
    render(ui(mk('a', 'b')))
    advance(RUN + GAP_MS)
    expect(add.mock.calls.filter(([type]) => type === 'scroll' || type === 'resize')).toEqual([])
    expect(observers).toHaveLength(0)
  })
})

describe('Sequence, scroll-gated', () => {
  it('types the first prompt after LEAD_MS with no scroll event, wherever it is', () => {
    tops = { a: 5000 }
    const { container } = render(ui(mk('a', 'b'), true))
    advance(LEAD_MS + CHAR)
    expect(typed(container, 'a')).toBe('a')
  })

  it('shows the next prompt line on its turn below the threshold, and types it only once a scroll brings it in reach', () => {
    tops = { b: 1000 }
    const { container } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS)
    expect(ids(container)).toEqual(['a', 'b'])
    expect(cursorState(container, 'b')).toBe('idle')
    expect(typed(container, 'b')).toBe('')
    advance(LEAD_MS * 5)
    expect(cursorState(container, 'b')).toBe('idle')
    expect(typed(container, 'b')).toBe('')
    tops.b = 750 // still 50 px short of the 200 px offset
    scroll()
    expect(cursorState(container, 'b')).toBe('idle')
    tops.b = 700
    scroll()
    expect(cursorState(container, 'b')).toBe('typing')
    advance(CHAR)
    expect(typed(container, 'b')).toBe('b')
  })

  it('a prompt reached early still waits for LEAD_MS since it appeared', () => {
    tops = { b: 1000 }
    const { container } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS)
    advance(LEAD_MS / 2)
    tops.b = 300
    scroll()
    expect(cursorState(container, 'b')).toBe('idle')
    advance(LEAD_MS / 2)
    expect(cursorState(container, 'b')).toBe('typing')
  })

  it('a prompt already in reach still waits for its turn', () => {
    tops = { a: 0, b: 100 }
    const { container } = render(ui(mk('a', 'b'), true))
    scroll()
    advance(RUN + GAP_MS - 1)
    expect(ids(container)).toEqual(['a'])
    advance(1)
    expect(ids(container)).toEqual(['a', 'b'])
    expect(cursorState(container, 'b')).toBe('idle')
    advance(LEAD_MS)
    expect(cursorState(container, 'b')).toBe('typing')
  })

  it('latches: scrolling back out of reach does not stop it', () => {
    tops = { b: 1000 }
    const { container } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS)
    tops.b = 500
    scroll()
    tops.b = 2000
    scroll()
    advance(LEAD_MS + 2 * CHAR + PAUSE_MS)
    expect(typed(container, 'b')).toBe('bb')
    expect(revealed(container, 'b')).toBe('true')
  })

  it('counts the page bottom with the prompt on screen as reached', () => {
    tops = { b: 850 }
    const { container } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS + LEAD_MS)
    expect(cursorState(container, 'b')).toBe('idle')
    viewport.scrollY = 4100 // 4100 + 900 >= 5000 - 1
    scroll()
    expect(cursorState(container, 'b')).toBe('typing')
  })

  it('does not count the page bottom when the prompt is below the viewport', () => {
    tops = { b: 1000 }
    viewport.scrollY = 4100
    const { container } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS + LEAD_MS)
    scroll()
    expect(cursorState(container, 'b')).toBe('idle')
  })

  it('re-evaluates on resize', () => {
    tops = { b: 1000 }
    const { container } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS + LEAD_MS)
    viewport.innerHeight = 1400
    act(() => void fireEvent(window, new Event('resize')))
    expect(cursorState(container, 'b')).toBe('typing')
  })

  it('re-evaluates on body layout changes (ResizeObserver)', () => {
    tops = { b: 1000 }
    const { container } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS + LEAD_MS)
    expect(observers).toHaveLength(1)
    expect(observers[0].observe).toHaveBeenCalledWith(document.body)
    tops.b = 400
    act(() => observers[0].cb())
    expect(cursorState(container, 'b')).toBe('typing')
  })

  it('works without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    tops = { b: 1000 }
    const { container } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS + LEAD_MS)
    tops.b = 400
    scroll()
    expect(cursorState(container, 'b')).toBe('typing')
  })

  it('removes its listeners and observer on unmount', () => {
    tops = { b: 1000 }
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS)
    const added = add.mock.calls.filter(([type]) => type === 'scroll' || type === 'resize')
    expect(added.map(([type]) => type).sort()).toEqual(['resize', 'scroll'])
    expect(added.find(([type]) => type === 'scroll')![2]).toMatchObject({ passive: true })
    unmount()
    for (const [type, fn] of added) {
      expect(remove.mock.calls.some(([t, f]) => t === type && f === fn)).toBe(true)
    }
    expect(observers[0].disconnect).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('removes its listeners once reached', () => {
    tops = { b: 1000 }
    const remove = vi.spyOn(window, 'removeEventListener')
    render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS)
    tops.b = 0
    scroll()
    expect(remove.mock.calls.map(([t]) => t)).toEqual(expect.arrayContaining(['scroll', 'resize']))
    expect(observers[0].disconnect).toHaveBeenCalled()
  })

  it('latches a step that mounts above the viewport at once, and types it after the lead', () => {
    tops = { b: -500 }
    const { container } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS)
    expect(cursorState(container, 'b')).toBe('idle')
    advance(LEAD_MS - 1)
    expect(cursorState(container, 'b')).toBe('idle')
    advance(1)
    expect(cursorState(container, 'b')).toBe('typing')
    advance(2 * CHAR)
    expect(typed(container, 'b')).toBe('bb')
  })

  it('types steps that are all in reach at load strictly one after another', () => {
    tops = { a: 0, b: 100, c: 200, d: 300 }
    const steps = mk('a', 'b', 'c', 'd')
    const { container } = render(ui(steps, true))
    const order: string[] = []
    const lastTexts: Record<string, string> = {}
    drain(() => {
      const active = ids(container).filter((id) => revealed(container, id) === 'false' && typed(container, id) !== '')
      const typing = ids(container).filter((id) => cursorState(container, id) === 'typing')
      expect(active.length).toBeLessThanOrEqual(1)
      expect(typing.length).toBeLessThanOrEqual(1)
      for (const id of typing) if (order[order.length - 1] !== id) order.push(id)
      // every step before the last one rendered is already revealed
      const shown = ids(container)
      for (const id of shown.slice(0, -1)) expect(revealed(container, id)).toBe('true')
      for (const id of shown) {
        const cur = typed(container, id)
        expect(cur.startsWith(lastTexts[id] ?? '')).toBe(true)
        expect((id + id).startsWith(cur)).toBe(true)
        lastTexts[id] = cur
      }
    })
    expect(order).toEqual(['a', 'b', 'c', 'd'])
    expect(steps.map((s) => typed(container, s.id))).toEqual(['aa', 'bb', 'cc', 'dd'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('types each command once, in order, with exact text under StrictMode', () => {
    tops = { b: 1000, c: 1000 }
    const steps = mk('a', 'b', 'c')
    const { container } = render(<StrictMode>{ui(steps, true)}</StrictMode>)
    const prev: Record<string, string> = {}
    const check = () => {
      for (const id of ids(container)) {
        const cur = typed(container, id)
        expect(cur.startsWith(prev[id] ?? '')).toBe(true)
        expect((id + id).startsWith(cur)).toBe(true)
        prev[id] = cur
      }
    }
    drain(check)
    expect(ids(container)).toEqual(['a', 'b'])
    expect(typed(container, 'b')).toBe('')
    tops = { b: 0, c: 0 }
    scroll()
    drain(check)
    expect(ids(container)).toEqual(['a', 'b', 'c'])
    expect(steps.map((s) => typed(container, s.id))).toEqual(['aa', 'bb', 'cc'])
    expect(['a', 'b', 'c'].map((id) => revealed(container, id))).toEqual(['true', 'true', 'true'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('a language switch while the sequence runs changes no typed text and restarts nothing', () => {
    tops = { b: 0 }
    const { container } = render(ui(mk('a', 'b'), true))
    advance(RUN + GAP_MS + LEAD_MS + CHAR)
    expect(typed(container, 'a')).toBe('aa')
    expect(typed(container, 'b')).toBe('b')
    const timers = vi.getTimerCount()
    act(() => void fireEvent.click(container.querySelector('button')!))
    expect(typed(container, 'a')).toBe('aa')
    expect(typed(container, 'b')).toBe('b')
    expect(cursorState(container, 'b')).toBe('typing')
    expect(vi.getTimerCount()).toBe(timers)
    advance(CHAR - 1)
    expect(typed(container, 'b')).toBe('b')
    advance(1)
    expect(typed(container, 'b')).toBe('bb')
    advance(PAUSE_MS)
    expect(revealed(container, 'b')).toBe('true')
    expect(ids(container)).toEqual(['a', 'b'])
  })
})
