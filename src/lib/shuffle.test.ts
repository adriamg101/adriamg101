import { describe, expect, it } from 'vitest'
import { shuffle } from './shuffle'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

describe('shuffle', () => {
  it('returns a permutation and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const copy = [...input]
    const out = shuffle(input, seeded(42))
    expect(input).toEqual(copy)
    expect([...out].sort((a, b) => a - b)).toEqual(copy)
    expect(out).not.toBe(input)
  })
  it('is deterministic for a given random source', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded(7))).toEqual(shuffle([1, 2, 3, 4, 5], seeded(7)))
  })
  it('handles empty input', () => {
    expect(shuffle([])).toEqual([])
  })
})
