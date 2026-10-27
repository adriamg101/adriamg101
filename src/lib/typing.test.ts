import { describe, expect, it } from 'vitest'
import { charDelay, GAP_MS, LEAD_MS, PAUSE_MS } from './typing'

describe('charDelay', () => {
  it('is 30 at the low end', () => expect(charDelay(() => 0)).toBe(30))
  it('is 60 at the high end', () => expect(charDelay(() => 1)).toBe(60))
  it('stays within range by default', () => {
    for (let i = 0; i < 50; i++) {
      const d = charDelay()
      expect(d).toBeGreaterThanOrEqual(30)
      expect(d).toBeLessThanOrEqual(60)
    }
  })
})

describe('timing constants', () => {
  it('has the agreed values', () => expect([LEAD_MS, PAUSE_MS, GAP_MS]).toEqual([700, 250, 300]))
  it('LEAD_MS is 700: one blink cycle (on, off) before typing', () => expect(LEAD_MS).toBe(700))
})
