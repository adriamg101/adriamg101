import { describe, expect, it } from 'vitest'
import { SHOW_AFTER_PX, shouldShowBackToTop } from './scroll'

describe('shouldShowBackToTop', () => {
  it('uses a 100px threshold', () => expect(SHOW_AFTER_PX).toBe(100))
  it('is hidden near the top', () => {
    expect(shouldShowBackToTop(0, 2000, 800)).toBe(false)
    expect(shouldShowBackToTop(99, 2000, 800)).toBe(false)
  })
  it('is shown once scrolled far enough', () => {
    expect(shouldShowBackToTop(100, 2000, 800)).toBe(true)
  })
  it('is hidden when the page is not scrollable', () => {
    expect(shouldShowBackToTop(500, 700, 800)).toBe(false)
  })
})
