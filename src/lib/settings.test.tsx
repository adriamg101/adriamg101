import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsProvider, useSettings, useT } from './settings'

const wrapper = ({ children }: { children: ReactNode }) => <SettingsProvider>{children}</SettingsProvider>

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('settings', () => {
  it('defaults to en/dark even if the system prefers light', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('light'), media: q }))
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.lang).toBe('en')
    expect(result.current.theme).toBe('dark')
  })

  it('restores a stored language', () => {
    localStorage.setItem('portfolio.lang', 'es')
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.lang).toBe('es')
    expect(document.documentElement.lang).toBe('es')
  })

  it('ignores garbage in storage', () => {
    localStorage.setItem('portfolio.lang', 'xx')
    localStorage.setItem('portfolio.theme', 'purple')
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.lang).toBe('en')
    expect(result.current.theme).toBe('dark')
  })

  it('survives a throwing localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.lang).toBe('en')
    expect(result.current.theme).toBe('dark')
    expect(() => act(() => result.current.setLang('ca'))).not.toThrow()
    expect(result.current.lang).toBe('ca')
  })

  it('persists the language', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.setLang('ca'))
    expect(localStorage.getItem('portfolio.lang')).toBe('ca')
  })

  it('toggleTheme flips the document theme', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(document.documentElement.dataset.theme).toBe('dark')
    act(() => result.current.toggleTheme())
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('portfolio.theme')).toBe('light')
    act(() => result.current.toggleTheme())
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('useT translates by the current language', () => {
    localStorage.setItem('portfolio.lang', 'es')
    const { result } = renderHook(() => useT(), { wrapper })
    expect(result.current('section.projects')).toBe('Proyectos')
  })
})
