import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ScrollToTop } from './ScrollToTop'

const original = window.scrollTo
afterEach(() => {
  window.scrollTo = original
})

function Nav() {
  const navigate = useNavigate()
  return <button onClick={() => navigate(-1)}>back</button>
}

function setup(path = '/') {
  const spy = vi.fn()
  window.scrollTo = spy as unknown as typeof window.scrollTo
  render(
    <MemoryRouter initialEntries={[path]}>
      <ScrollToTop />
      <Link to="/">root</Link>
      <Link to="/projects">proj</Link>
      <Link to="/projects/a">detail</Link>
      <Nav />
    </MemoryRouter>,
  )
  return spy
}

describe('ScrollToTop', () => {
  it('scrolls to the top on mount', () => {
    const spy = setup()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(0, 0)
  })

  it('scrolls to the top on every navigation, including a second click on the same link', async () => {
    const spy = setup('/projects')
    await userEvent.click(screen.getByText('root'))
    expect(spy).toHaveBeenCalledTimes(2)
    await userEvent.click(screen.getByText('root'))
    expect(spy).toHaveBeenCalledTimes(3)
    await userEvent.click(screen.getByText('proj'))
    expect(spy).toHaveBeenCalledTimes(4)
    expect(spy).toHaveBeenLastCalledWith(0, 0)
  })

  it('restores the saved scroll position on Back (POP)', async () => {
    const spy = setup('/projects')
    const setY = (y: number) => Object.defineProperty(window, 'scrollY', { configurable: true, value: y })
    setY(420)
    await userEvent.click(screen.getByText('detail'))
    expect(spy).toHaveBeenLastCalledWith(0, 0) // PUSH
    setY(0)
    await userEvent.click(screen.getByText('back'))
    expect(spy).toHaveBeenLastCalledWith(0, 420)
  })

  it('does not throw without window.scrollTo', () => {
    // @ts-expect-error simulate a missing API
    window.scrollTo = undefined
    expect(() =>
      render(
        <MemoryRouter>
          <ScrollToTop />
        </MemoryRouter>,
      ),
    ).not.toThrow()
  })
})

describe('ScrollToTop, POP to a location never visited here', () => {
  it('falls back to 0', async () => {
    const spy = vi.fn()
    window.scrollTo = spy as unknown as typeof window.scrollTo
    render(
      <MemoryRouter initialEntries={['/a', '/b']} initialIndex={1}>
        <ScrollToTop />
        <Nav />
      </MemoryRouter>,
    )
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 300 })
    await userEvent.click(screen.getByText('back'))
    expect(spy).toHaveBeenLastCalledWith(0, 0)
  })
})
