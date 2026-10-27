import { describe, expect, it } from 'vitest'
import { REACH_OFFSET_PX, hasReached } from './reach'

describe('hasReached', () => {
  it('uses a 200 px offset by default', () => expect(REACH_OFFSET_PX).toBe(200))
  it.each([
    [500, 900, false, true],
    [700, 900, false, true],
    [701, 900, false, false],
    [750, 900, false, false],
    [-50, 900, false, true], // above the viewport
    [850, 900, true, true], // page bottom, on screen
    [900, 900, true, true],
    [1000, 900, true, false], // page bottom but below the viewport
  ])('top %d, innerHeight %d, atBottom %s -> %s', (top, h, bottom, expected) => {
    expect(hasReached(top, h, bottom)).toBe(expected)
  })
  it('accepts a custom offset', () => {
    expect(hasReached(750, 900, false, 100)).toBe(true)
    expect(hasReached(850, 900, false, 100)).toBe(false)
    expect(hasReached(900, 900, false, 0)).toBe(true)
  })
})
