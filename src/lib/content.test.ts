import { content, sortEntries, missingTranslations } from './content'
import type { Content, Entry } from './schema'

const mk = (id: string, start?: string): Entry => ({
  id,
  title: { en: id },
  description: { en: id },
  start,
  languages: [],
  tools: [],
  frameworks: [],
  home: false,
})

describe('sortEntries', () => {
  it('orders newest first, undated last, without mutating', () => {
    const input = [mk('none'), mk('old', '2022-01'), mk('new', '2024-03')]
    const out = sortEntries(input)
    expect(out.map((e) => e.id)).toEqual(['new', 'old', 'none'])
    expect(input.map((e) => e.id)).toEqual(['none', 'old', 'new'])
  })

  it('is stable for equal starts', () => {
    const out = sortEntries([mk('a', '2024-01'), mk('b', '2024-01')])
    expect(out.map((e) => e.id)).toEqual(['a', 'b'])
  })
})

describe('missingTranslations', () => {
  it('reports one string per missing es/ca field', () => {
    const c: Content = {
      about: {
        name: 'A',
        tagline: { en: 't', es: 't', ca: 't' }, bio: { en: 'b', es: 'b', ca: 'b' },
        photo: 'p.svg',
        prompt: { user: 'u', host: 'h' },
        lines: [],
      },
      sections: [
        {
          key: 'projects',
          titleKey: 'section.projects',
          entries: [{ ...mk('foo'), title: { en: 'x', es: 'x', ca: 'x' }, description: { en: 'd', es: 'd' } }],
        },
      ],
      skillOverrides: {},
    }
    expect(missingTranslations(c)).toEqual(['projects/foo: description.ca'])
  })

  it('reports a download label without es/ca', () => {
    const e = { ...mk('foo'), downloads: [{ label: { en: 'Thesis' }, file: 'docs/t.pdf' }] }
    const c: Content = {
      about: {
        name: 'A',
        tagline: { en: 't', es: 't', ca: 't' }, bio: { en: 'b', es: 'b', ca: 'b' },
        photo: 'p.svg',
        prompt: { user: 'u', host: 'h' },
        lines: [],
      },
      sections: [{ key: 'projects', titleKey: 'section.projects', entries: [{ ...e, title: { en: 'a', es: 'a', ca: 'a' }, description: { en: 'd', es: 'd', ca: 'd' } }] }],
      skillOverrides: {},
    }
    expect(missingTranslations(c)).toEqual(['projects/foo: downloads[0].label.es', 'projects/foo: downloads[0].label.ca'])
  })

  it('warns for a translatable line label missing ca but not for plain strings', () => {
    const c: Content = {
      about: {
        name: 'A',
        tagline: { en: 't', es: 't', ca: 't' },
        bio: { en: 'b', es: 'b', ca: 'b' },
        photo: 'p.svg',
        prompt: { user: 'u', host: 'h' },
        lines: [
          { label: { en: 'Role', es: 'Rol' }, value: 'Dev' },
          { label: 'Email', value: 'you@example.com' },
        ],
      },
      sections: [],
      skillOverrides: {},
    }
    expect(missingTranslations(c)).toEqual(['about: lines[0].label.ca'])
  })
})

describe('missingTranslations rows', () => {
  it('warns for object name/level missing ca, not for plain strings', () => {
    const c: Content = {
      about: {
        name: 'A',
        tagline: { en: 't', es: 't', ca: 't' },
        bio: { en: 'b', es: 'b', ca: 'b' },
        photo: 'p.svg',
        prompt: { user: 'u', host: 'h' },
        lines: [
          {
            label: 'Languages',
            rows: [
              { name: { en: 'Catalan', es: 'Catalán' }, level: { en: 'Native', es: 'Nativo', ca: 'Natiu' } },
              { name: 'English', level: { en: 'B2', es: 'B2' } },
              { name: 'Spanish', level: 'B2' },
            ],
          },
        ],
      },
      sections: [],
      skillOverrides: {},
    }
    expect(missingTranslations(c)).toEqual(['about: lines[0].rows[0].name.ca', 'about: lines[0].rows[1].level.ca'])
  })
})

describe('shipped about lines', () => {
  const labelEn = (l: { label: string | { en: string } }) => (typeof l.label === 'string' ? l.label : l.label.en)
  it('has the languages table with the exact levels', () => {
    const l = content.about.lines.find((x) => labelEn(x) === 'Languages')!
    expect(l.rows!.map((r) => (typeof r.name === 'string' ? r.name : r.name.en))).toEqual(['Catalan', 'Spanish', 'English'])
    expect(l.rows!.map((r) => (typeof r.level === 'string' ? r.level : r.level.en))).toEqual(['Native', 'Native', 'B2'])
    expect(JSON.stringify(l)).not.toMatch(/placeholder|ejemplo|exemple/)
  })
  it('has a downloadable CV line before the contact lines', () => {
    const lines = content.about.lines
    const i = lines.findIndex((x) => labelEn(x) === 'CV')
    expect(lines[i]).toMatchObject({ href: 'cv-placeholder.pdf', download: true })
    expect(i).toBeLessThan(lines.findIndex((x) => labelEn(x) === 'GitHub'))
  })
})

describe('content sections', () => {
  it('lists hobbies after education', () => {
    expect(content.sections.map((s) => s.key)).toEqual(['projects', 'experience', 'education', 'hobbies'])
  })

  it('gives every shipped entry a card summary in English', () => {
    for (const s of content.sections) {
      for (const e of s.entries) {
        expect(e.summary?.en, `${s.key}/${e.id}`).toBeTruthy()
      }
    }
  })

  it('the shipped about has the full name and no redundant Name line', () => {
    expect(content.about.name).toBe('Adrià Martínez Gallifa')
    expect(content.about.lines.some((l) => (typeof l.label === 'string' ? l.label : l.label.en) === 'Name')).toBe(false)
  })
})

describe('missingTranslations summary', () => {
  it('warns for a summary missing ca', () => {
    const e: Entry = { ...mk('s'), summary: { en: 'a', es: 'b' } }
    const c = { about: content.about, sections: [{ key: 'projects', titleKey: 'section.projects', entries: [e] }], skillOverrides: {} } as Content
    expect(missingTranslations(c)).toContain('projects/s: summary.ca')
  })
})

describe('missingTranslations media alt', () => {
  const run = (e: Entry) =>
    missingTranslations({ about: content.about, sections: [{ key: 'projects', titleKey: 'section.projects', entries: [e] }], skillOverrides: {} } as Content).filter((w) => w.includes('media['))
  it('warns for an object alt missing es and ca', () => {
    const out = run({ ...mk('m'), media: [{ src: 'a.svg', alt: { en: 'x', es: 'y' } }, { src: 'b.svg', alt: { en: 'x' } }] })
    expect(out).toContain('projects/m: media[0].alt.ca')
    expect(out).toContain('projects/m: media[1].alt.es')
    expect(out).toContain('projects/m: media[1].alt.ca')
  })
  it('does not warn for a string alt or an empty alt', () => {
    expect(run({ ...mk('m'), media: [{ src: 'a.svg', alt: 'x' }, { src: 'b.svg', alt: '' }, { src: 'c.svg' }] })).toEqual([])
  })
  it('does not crash without media', () => expect(run(mk('m'))).toEqual([]))
})
