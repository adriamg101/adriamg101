import { describe, expect, it } from 'vitest'
import { descriptionParagraphs, entryFileName, entrySubtitle, entrySummary, slugify } from './entry'
import type { Entry } from './schema'

const mk = (p: Partial<Entry> = {}): Entry => ({
  id: 'x1',
  title: { en: 'X' },
  description: { en: 'first para\n\nsecond para' },
  languages: [],
  tools: [],
  frameworks: [],
  home: false,
  ...p,
})

describe('slugify', () => {
  it('lowercases and hyphenates', () => expect(slugify('Log Analyzer')).toBe('log-analyzer'))
  it('strips accents and punctuation', () => expect(slugify('  Análisis de   Logs! (v2) ')).toBe('analisis-de-logs-v2'))
  it('can be empty', () => expect(slugify('!!!')).toBe(''))
  it('collapses hyphens', () => expect(slugify('a--b')).toBe('a-b'))
  it('keeps dots and underscores', () => expect(slugify('a.b_c')).toBe('a.b_c'))
  it('does not throw on a long title', () => expect(() => slugify('ab '.repeat(70))).not.toThrow())
})

describe('entryFileName', () => {
  it('uses the english title slug', () => expect(entryFileName({ id: 'x1', title: { en: 'Log Analyzer' } })).toBe('log-analyzer'))
  it('falls back to the id', () => expect(entryFileName({ id: 'x1', title: { en: '!!!' } })).toBe('x1'))
  it('gives equal names for equal titles', () => {
    expect(entryFileName({ id: 'a', title: { en: 'Same' } })).toBe(entryFileName({ id: 'b', title: { en: 'Same' } }))
  })
})

describe('entrySubtitle', () => {
  it('joins organization and role', () => {
    const e = mk({ organization: 'Acme', role: { en: 'Dev', es: 'Desarrollador' } })
    expect(entrySubtitle(e, 'es')).toBe('Acme · Desarrollador')
  })
  it('joins institution and degree', () => {
    expect(entrySubtitle(mk({ institution: 'Uni', degree: { en: 'BSc' } }), 'ca')).toBe('Uni · BSc')
  })
  it('is empty otherwise', () => expect(entrySubtitle(mk(), 'en')).toBe(''))
})

describe('entrySummary', () => {
  it('prefers the summary', () => expect(entrySummary(mk({ summary: { en: 'S', es: 'Se' } }), 'es')).toBe('Se'))
  it('falls back to en within the summary', () => expect(entrySummary(mk({ summary: { en: 'S' } }), 'ca')).toBe('S'))
  it('falls back to the first paragraph', () => expect(entrySummary(mk(), 'en')).toBe('first para'))
})

describe('descriptionParagraphs', () => {
  it('splits on blank lines, trims and drops empties', () => {
    expect(descriptionParagraphs('a\n\n b \n\n\nc')).toEqual(['a', 'b', 'c'])
  })
})

describe('pinned behavior', () => {
  it('splits CRLF paragraphs', () => expect(descriptionParagraphs('a\r\n\r\nb')).toEqual(['a', 'b']))
  it('splits on whitespace-only separator lines', () => expect(descriptionParagraphs('a\n   \t\nb')).toEqual(['a', 'b']))
  it('falls back to the id for a Japanese-only title', () =>
    expect(entryFileName({ id: 'jp1', title: { en: '日本語のタイトル' } })).toBe('jp1'))
  it('uses the first paragraph in the requested language without a summary', () =>
    expect(entrySummary(mk({ description: { en: 'e1\n\ne2', es: 's1\n\ns2' } }), 'es')).toBe('s1'))
  it('falls back to the en summary when ca is missing', () =>
    expect(entrySummary(mk({ summary: { en: 'S', es: 'Se' } }), 'ca')).toBe('S'))
})
