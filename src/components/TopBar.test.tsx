import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SettingsProvider } from '../lib/settings'
import { sections } from '../test-fixtures'
import { TopBar } from './TopBar'

function setup(hasSkills?: boolean) {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <TopBar sections={sections} hasSkills={hasSkills} />
      </SettingsProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => localStorage.clear())

describe('TopBar', () => {
  it('shows home and sections with entries, hides empty ones', () => {
    setup()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects')
    expect(screen.getByRole('link', { name: 'Education' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Experience' })).toBeNull()
  })

  it('links to skills by default and omits it when there are none', () => {
    setup()
    expect(screen.getByRole('link', { name: 'Skills' })).toHaveAttribute('href', '/skills')
    cleanup()
    setup(false)
    expect(screen.queryByRole('link', { name: 'Skills' })).toBeNull()
  })

  it('switches and persists the language', async () => {
    setup()
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'ES' }))
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false')
    expect(localStorage.getItem('portfolio.lang')).toBe('es')
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument()
  })

  describe('--topbar-height', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
      document.documentElement.style.removeProperty('--topbar-height')
    })

    it('reports the border-box height on mount and after the observer fires, ignoring contentRect', () => {
      let cb: (entries: unknown[]) => void = () => {}
      const disconnect = vi.fn()
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(c: typeof cb) {
            cb = c
          }
          observe() {}
          disconnect = disconnect
        },
      )
      let height = 73
      const spy = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockImplementation(() => ({ height }) as DOMRect)
      const { unmount } = setup()
      const read = () => document.documentElement.style.getPropertyValue('--topbar-height')
      expect(read()).toBe('73px')
      act(() => cb([{ contentRect: { height: 48 } }]))
      expect(read()).toBe('73px')
      height = 120 // phone wrap
      act(() => cb([{ contentRect: { height: 95 } }]))
      expect(read()).toBe('120px')
      unmount()
      expect(disconnect).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('renders and measures once without ResizeObserver', () => {
      vi.stubGlobal('ResizeObserver', undefined)
      setup()
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
      expect(document.documentElement.style.getPropertyValue('--topbar-height')).toMatch(/^\d+(\.\d+)?px$/)
    })
  })
})
