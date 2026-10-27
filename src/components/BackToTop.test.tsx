import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsProvider } from '../lib/settings'
import { BackToTop } from './BackToTop'

const originalScrollTo = window.scrollTo
let scrollY = 0
let scrollHeight = 2000
let observers: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; cb: () => void }[]

beforeEach(() => {
  localStorage.clear()
  scrollY = 0
  scrollHeight = 2000
  observers = []
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, get: () => scrollHeight })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve = vi.fn()
      constructor(public cb: () => void) {
        observers.push(this)
      }
    },
  )
})
afterEach(() => {
  window.scrollTo = originalScrollTo
  vi.unstubAllGlobals()
})

function setup() {
  return render(
    <SettingsProvider>
      <BackToTop />
    </SettingsProvider>,
  )
}
function scrollTo(y: number) {
  scrollY = y
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

describe('BackToTop', () => {
  it('is hidden at the top', () => {
    setup()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows after scrolling and hides when the page stops being scrollable on resize', () => {
    setup()
    scrollTo(300)
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument()
    scrollHeight = 600
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('reacts to the body ResizeObserver', () => {
    setup()
    scrollY = 300
    act(() => observers[0].cb())
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('scrolls to the top smoothly', async () => {
    const spy = vi.fn()
    window.scrollTo = spy as unknown as typeof window.scrollTo
    setup()
    scrollTo(300)
    await userEvent.click(screen.getByRole('button'))
    expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('does not animate under reduced motion', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const spy = vi.fn()
    window.scrollTo = spy as unknown as typeof window.scrollTo
    setup()
    scrollTo(300)
    await userEvent.click(screen.getByRole('button'))
    expect(spy).toHaveBeenCalledTimes(1)
    const arg = spy.mock.calls[0][0]
    expect(arg.top).toBe(0)
    expect(arg.behavior).not.toBe('smooth')
  })

  it('is keyboard focusable and labelled in the current language', async () => {
    localStorage.setItem('portfolio.lang', 'es')
    setup()
    scrollTo(300)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Volver arriba' })).toHaveFocus()
  })

  it('removes listeners and the observer on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = setup()
    unmount()
    for (const type of ['scroll', 'resize']) {
      expect(add.mock.calls.some((c) => c[0] === type)).toBe(true)
      expect(remove.mock.calls.some((c) => c[0] === type)).toBe(true)
    }
    expect(observers[0].disconnect).toHaveBeenCalled()
    add.mockRestore()
    remove.mockRestore()
  })

  it('is visible on mount when the page is already scrolled', () => {
    scrollY = 400
    setup()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('works without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    setup()
    expect(screen.queryByRole('button')).toBeNull()
    scrollTo(300)
    expect(screen.getByRole('button')).toBeInTheDocument()
    scrollHeight = 500
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(screen.queryByRole('button')).toBeNull()
  })
})
