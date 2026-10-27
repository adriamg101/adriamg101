import { describe, expect, it } from 'vitest'
import { copiesNeeded, isDrag, wrapOffset } from './marquee'

describe('copiesNeeded', () => {
  it('returns 2 for empty content', () => expect(copiesNeeded(0, 1000)).toBe(2))
  it('covers the viewport plus one', () => expect(copiesNeeded(300, 1000)).toBe(5))
  it('never goes below 2', () => expect(copiesNeeded(2000, 1000)).toBe(2))
})

describe('wrapOffset', () => {
  it('wraps negative overflow', () => expect(wrapOffset(-350, 300)).toBe(-50))
  it('wraps positive offsets', () => expect(wrapOffset(20, 300)).toBe(-280))
  it('returns 0 without a loop width', () => expect(wrapOffset(5, 0)).toBe(0))
  it('maps an exact multiple to 0, not -0', () => expect(Object.is(wrapOffset(-300, 300), 0)).toBe(true))
})

describe('isDrag', () => {
  it('ignores small movement', () => expect(isDrag(5)).toBe(false))
  it('detects movement in either direction', () => {
    expect(isDrag(-6)).toBe(true)
    expect(isDrag(6)).toBe(true)
  })
})
