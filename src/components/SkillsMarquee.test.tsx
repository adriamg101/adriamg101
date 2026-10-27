import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Skill } from '../lib/skills'
import { SkillsMarquee } from './SkillsMarquee'

const react: Skill = { key: 'react', name: 'React', category: 'frameworks' }
const ts: Skill = { key: 'typescript', name: 'TypeScript', category: 'languages' }

describe('SkillsMarquee', () => {
  it('renders a button per skill and reports the selected key', async () => {
    const onSelect = vi.fn()
    render(<SkillsMarquee skills={[react, ts]} onSelect={onSelect} />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: /react/i }))
    expect(onSelect).toHaveBeenCalledWith('react')
  })

  it('renders nothing for no skills', () => {
    const { container } = render(<SkillsMarquee skills={[]} onSelect={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders at least two copies of a single skill, extra copies hidden from a11y', () => {
    render(<SkillsMarquee skills={[react]} onSelect={() => {}} />)
    expect(screen.getAllByRole('button', { hidden: true }).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('does not select after a drag', () => {
    const onSelect = vi.fn()
    render(<SkillsMarquee skills={[react, ts]} onSelect={onSelect} />)
    const btn = screen.getByRole('button', { name: /react/i })
    fireEvent.pointerDown(btn, { pointerId: 1, clientX: 100, button: 0 })
    fireEvent.pointerMove(btn, { pointerId: 1, clientX: 140 })
    fireEvent.pointerUp(btn, { pointerId: 1, clientX: 140 })
    fireEvent.click(btn)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('still selects after a tiny movement', () => {
    const onSelect = vi.fn()
    render(<SkillsMarquee skills={[react]} onSelect={onSelect} />)
    const btn = screen.getByRole('button', { name: /react/i })
    fireEvent.pointerDown(btn, { pointerId: 1, clientX: 100, button: 0 })
    fireEvent.pointerMove(btn, { pointerId: 1, clientX: 103 })
    fireEvent.pointerUp(btn, { pointerId: 1, clientX: 103 })
    fireEvent.click(btn)
    expect(onSelect).toHaveBeenCalledWith('react')
  })

  it('cancels its animation frame on unmount', () => {
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = render(<SkillsMarquee skills={[react]} onSelect={() => {}} />)
    unmount()
    expect(cancel).toHaveBeenCalled()
    cancel.mockRestore()
  })

  it('exposes each skill name once (mapped and unmapped)', () => {
    const csharp: Skill = { key: 'c#', name: 'C#', category: 'languages' }
    const { container } = render(<SkillsMarquee skills={[react, csharp]} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'C#' })).toBeInTheDocument()
    const first = container.querySelector('.marquee-set')!
    expect(first.textContent).toBe('ReactC#')
  })

  describe('prefers-reduced-motion', () => {
    const realMatchMedia = window.matchMedia
    const realRaf = window.requestAnimationFrame
    afterEach(() => {
      window.matchMedia = realMatchMedia
      window.requestAnimationFrame = realRaf
      delete (HTMLElement.prototype as { offsetWidth?: number }).offsetWidth
    })
    function run(reduce: boolean) {
      window.matchMedia = ((q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
      let cb: FrameRequestCallback | null = null
      window.requestAnimationFrame = ((f: FrameRequestCallback) => ((cb = f), 1)) as typeof window.requestAnimationFrame
      const { container } = render(<SkillsMarquee skills={[react]} onSelect={() => {}} />)
      const track = container.querySelector<HTMLElement>('.marquee-track')!
      return { track, tick: (t: number) => cb?.(t) }
    }
    it('advances the offset normally', () => {
      const { track, tick } = run(false)
      tick(0)
      tick(100)
      expect(track.style.transform).toBe('translate3d(-4px,0,0)')
    })
    it('pauses while focus is inside the marquee and resumes on blur', () => {
      const { track, tick } = run(false)
      const btn = screen.getByRole('button', { name: 'React' })
      tick(0)
      tick(100)
      expect(track.style.transform).toBe('translate3d(-4px,0,0)')
      act(() => btn.focus())
      tick(200)
      tick(300)
      expect(track.style.transform).toBe('translate3d(-4px,0,0)')
      act(() => btn.blur())
      tick(400)
      expect(track.style.transform).toBe('translate3d(-8px,0,0)')
    })
    it('does not auto-scroll when reduced motion is requested', () => {
      const { track, tick } = run(true)
      tick(0)
      tick(100)
      expect(track.style.transform).toBe('')
    })
  })
})
