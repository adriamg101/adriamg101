import { StrictMode, type ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnimationProvider, useAnimation } from './AnimationProvider'
import { ANIMATION_KEY, readRecord, writeRecord } from '../lib/visit'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
})

const wrap =
  (pageId: string) =>
  ({ children }: { children: ReactNode }) => <AnimationProvider pageId={pageId}>{children}</AnimationProvider>

describe('AnimationProvider', () => {
  it('animates a first visit and stores the page', () => {
    const before = Date.now()
    const { result } = renderHook(() => useAnimation(), { wrapper: wrap('home') })
    expect(result.current).toEqual({ animate: true })
    const rec = readRecord()!
    expect(rec.seen).toEqual(['home'])
    expect(rec.startedAt).toBeGreaterThanOrEqual(before)
    expect(rec.startedAt).toBeLessThanOrEqual(Date.now())
  })

  it('does not animate a page already seen, and keeps the record', () => {
    const startedAt = Date.now() - 1000
    writeRecord({ startedAt, seen: ['home'] })
    const { result } = renderHook(() => useAnimation(), { wrapper: wrap('home') })
    expect(result.current.animate).toBe(false)
    expect(readRecord()).toEqual({ startedAt, seen: ['home'] })
  })

  it('animates another page and adds it to the record', () => {
    const startedAt = Date.now() - 1000
    writeRecord({ startedAt, seen: ['home'] })
    const { result } = renderHook(() => useAnimation(), { wrapper: wrap('projects') })
    expect(result.current.animate).toBe(true)
    expect(readRecord()).toEqual({ startedAt, seen: ['home', 'projects'] })
  })

  it('does not animate with reduced motion and writes nothing', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q }))
    const { result } = renderHook(() => useAnimation(), { wrapper: wrap('home') })
    expect(result.current.animate).toBe(false)
    expect(localStorage.getItem(ANIMATION_KEY)).toBeNull()
  })

  it('stays animated under StrictMode', () => {
    const { result } = renderHook(() => useAnimation(), {
      wrapper: ({ children }) => (
        <StrictMode>
          <AnimationProvider pageId="home">{children}</AnimationProvider>
        </StrictMode>
      ),
    })
    expect(result.current.animate).toBe(true)
    expect(readRecord()!.seen).toEqual(['home'])
  })

  it('writes to storage only after mount, never during render (StrictMode)', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const writesDuringRender: number[] = []
    function Probe() {
      writesDuringRender.push(setItem.mock.calls.length)
      return null
    }
    renderHook(() => useAnimation(), {
      wrapper: ({ children }) => (
        <StrictMode>
          <AnimationProvider pageId="home">
            <Probe />
            {children}
          </AnimationProvider>
        </StrictMode>
      ),
    })
    expect(writesDuringRender.length).toBeGreaterThan(0)
    expect(writesDuringRender.every((n) => n === 0)).toBe(true)
    expect(setItem).toHaveBeenCalled()
    for (const [key] of setItem.mock.calls) expect(key).toBe(ANIMATION_KEY)
    expect(readRecord()!.seen).toEqual(['home'])
  })

  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAnimation())).toThrow()
  })
})
