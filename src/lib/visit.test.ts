import { afterEach, describe, expect, it, vi } from 'vitest'
import { ANIMATION_KEY, RETURN_WINDOW_MS, enterPage, readRecord, writeRecord } from './visit'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('enterPage', () => {
  const t = 1_000_000_000_000
  it('animates on first entry and records the page', () => {
    expect(enterPage(null, 'a', t, false)).toEqual({ animate: true, record: { startedAt: t, seen: ['a'] } })
  })
  it('animates another page and keeps startedAt', () => {
    const r = enterPage({ startedAt: t, seen: ['a'] }, 'b', t + 1000, false)
    expect(r).toEqual({ animate: true, record: { startedAt: t, seen: ['a', 'b'] } })
  })
  it('does not animate a seen page', () => {
    const r = enterPage({ startedAt: t, seen: ['a'] }, 'a', t + 1000, false)
    expect(r).toEqual({ animate: false, record: { startedAt: t, seen: ['a'] } })
  })
  it('starts fresh exactly at the window boundary', () => {
    const r = enterPage({ startedAt: t, seen: ['a'] }, 'a', t + RETURN_WINDOW_MS, false)
    expect(r).toEqual({ animate: true, record: { startedAt: t + RETURN_WINDOW_MS, seen: ['a'] } })
  })
  it('treats a future startedAt as expired', () => {
    const r = enterPage({ startedAt: t + 5000, seen: ['a'] }, 'a', t, false)
    expect(r).toEqual({ animate: true, record: { startedAt: t, seen: ['a'] } })
  })
  it('returns no record with reduced motion', () => {
    expect(enterPage(null, 'a', t, true)).toEqual({ animate: false, record: null })
  })
  it('tolerates and dedupes duplicate stored ids, without mutating input', () => {
    const input = { startedAt: t, seen: ['a', 'a'] }
    const r = enterPage(input, 'a', t + 1, false)
    expect(r).toEqual({ animate: false, record: { startedAt: t, seen: ['a'] } })
    expect(input.seen).toEqual(['a', 'a'])
  })
})

describe('readRecord / writeRecord', () => {
  it('returns null for missing or invalid data', () => {
    expect(readRecord()).toBeNull()
    for (const raw of ['abc', '{"startedAt":"x","seen":[]}', '{"startedAt":1,"seen":[1]}', 'null', '{"startedAt":-1,"seen":[]}', '{"startedAt":1,"seen":"a"}']) {
      localStorage.setItem(ANIMATION_KEY, raw)
      expect(readRecord()).toBeNull()
    }
  })
  it('returns null when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(readRecord()).toBeNull()
  })
  it('does not throw when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    expect(() => writeRecord({ startedAt: 1, seen: [] })).not.toThrow()
  })
  it('round-trips a record', () => {
    writeRecord({ startedAt: 5, seen: ['a', 'b'] })
    expect(readRecord()).toEqual({ startedAt: 5, seen: ['a', 'b'] })
  })
})
