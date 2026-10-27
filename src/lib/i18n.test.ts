import { describe, expect, it } from 'vitest'
import { pickText, ui } from './i18n'

describe('pickText', () => {
  it('falls back to en when the language is missing', () => {
    expect(pickText({ en: 'a' }, 'ca')).toBe('a')
  })
  it('falls back to en when the language is empty', () => {
    expect(pickText({ en: 'a', es: '' }, 'es')).toBe('a')
  })
  it('uses the requested language when present', () => {
    expect(pickText({ en: 'a', ca: 'b' }, 'ca')).toBe('b')
  })
})

describe('pickText with plain strings', () => {
  it('returns a plain string as is', () => {
    expect(pickText('plain', 'es')).toBe('plain')
  })
})

describe('ui', () => {
  it('has a non-empty string for every key in every language', () => {
    const keys = Object.keys(ui.en)
    expect(keys.length).toBeGreaterThan(0)
    for (const lang of ['en', 'es', 'ca'] as const) {
      expect(Object.keys(ui[lang]).sort()).toEqual([...keys].sort())
      for (const k of keys) {
        expect(ui[lang][k as keyof (typeof ui)['en']]).toMatch(/\S/)
      }
    }
  })
})

describe('new keys', () => {
  it('has the navigation and skill group labels', () => {
    expect(ui.es['nav.top']).toBe('Volver arriba')
    expect(ui.ca['skills.languages']).toBe('Llenguatges')
    expect(ui.en['skills.frameworks']).toBe('Frameworks')
    expect(ui.es['skills.tools']).toBe('Herramientas')
  })
})

describe('removed keys', () => {
  it('no longer has the skip-animation label', () => {
    for (const lang of ['en', 'es', 'ca'] as const) expect('anim.skip' in ui[lang]).toBe(false)
  })
})
