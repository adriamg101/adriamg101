import { parseContent } from './schema'

const about = {
  name: 'A',
  tagline: { en: 't' },
  bio: { en: 'b' },
  photo: 'p.svg',
  prompt: { user: 'u', host: 'h' },
  lines: [{ label: 'Email', value: 'you@example.com', href: 'mailto:you@example.com' }],
}
const entry = {
  id: 'foo',
  title: { en: 'Foo' },
  description: { en: 'Desc' },
  languages: ['TypeScript'],
  tools: [],
  frameworks: [],
  home: false,
}

function parse(data: unknown, key = 'projects', a: unknown = about) {
  return parseContent({ about: a, sections: [{ key, titleKey: 'section.projects', data }], skills: {} })
}

describe('parseContent', () => {
  it('parses a valid entry', () => {
    const c = parse([entry])
    expect(c.sections[0].entries[0].id).toBe('foo')
    expect(c.about.name).toBe('A')
  })

  it('rejects unknown fields, naming the field', () => {
    expect(() => parse([{ ...entry, framwork: [] }])).toThrow(/framwork/)
  })

  it('rejects duplicate ids within a section', () => {
    expect(() => parse([entry, entry])).toThrow(/duplicate.*foo/i)
  })

  it('rejects a missing languages field, naming file and path', () => {
    const { languages: _l, ...rest } = entry
    expect(() => parse([rest])).toThrow(/projects.*languages/)
  })

  it('accepts end "present" and rejects other non-dates', () => {
    expect(() => parse([{ ...entry, start: '2024-01', end: 'present' }])).not.toThrow()
    expect(() => parse([{ ...entry, end: 'next week' }])).toThrow(/end/)
  })

  it('requires organization and role for experience', () => {
    expect(() => parse([entry], 'experience')).toThrow(/organization/)
    expect(() =>
      parse([{ ...entry, organization: 'X', role: { en: 'Dev' } }], 'experience'),
    ).not.toThrow()
  })
})

describe('entry id and dates', () => {
  it('rejects ids that are not URL-safe', () => {
    expect(() => parse([{ ...entry, id: 'a/b' }])).toThrow(/id/)
    expect(() => parse([{ ...entry, id: 'has space' }])).toThrow(/letters, digits and hyphens/)
  })
  it('accepts a hyphenated id', () => {
    expect(parse([{ ...entry, id: 'my-project-1' }]).sections[0].entries[0].id).toBe('my-project-1')
  })
  it('rejects end without start, naming the entry', () => {
    expect(() => parse([{ ...entry, end: '2020-05' }])).toThrow(/"foo".*end.*start/)
  })
  it('accepts start without end', () => {
    expect(() => parse([{ ...entry, start: '2020-05' }])).not.toThrow()
  })
})

describe('about schema', () => {
  it('parses lines, photo and prompt', () => {
    const c = parse([entry])
    expect(c.about.lines[0].value).toBe('you@example.com')
    expect(c.about.photo).toBe('p.svg')
    expect(c.about.prompt).toEqual({ user: 'u', host: 'h' })
  })
  it('rejects contacts as an unknown key', () => {
    expect(() => parse([entry], 'projects', { ...about, contacts: [] })).toThrow(/contacts/)
  })
  it('rejects a line missing value', () => {
    expect(() => parse([entry], 'projects', { ...about, lines: [{ label: 'Email' }] })).toThrow(/value/)
  })
  it('accepts translatable labels and values', () => {
    const lines = [{ label: { en: 'Role', es: 'Rol' }, value: { en: 'Dev' } }]
    expect(parse([entry], 'projects', { ...about, lines }).about.lines).toHaveLength(1)
  })
})

describe('about line shapes', () => {
  const withLines = (lines: unknown[]) => () => parse([entry], 'projects', { ...about, lines })
  const rows = [{ name: { en: 'Catalan', es: 'Catalán' }, level: 'Native' }, { name: 'English', level: { en: 'B2' } }]
  it('accepts a rows line', () => {
    const c = parse([entry], 'projects', { ...about, lines: [{ label: 'Languages', rows }] })
    expect(c.about.lines[0].rows).toHaveLength(2)
  })
  it('rejects value together with rows, naming the problem', () => {
    expect(withLines([{ label: 'L', value: 'x', rows }])).toThrow(/exactly one of "value" or "rows"/)
  })
  it('rejects a line with neither value nor rows', () => {
    expect(withLines([{ label: 'L' }])).toThrow(/exactly one of "value" or "rows"/)
  })
  it('rejects empty rows', () => {
    expect(withLines([{ label: 'L', rows: [] }])).toThrow(/rows/)
  })
  it('rejects a row without level', () => {
    expect(withLines([{ label: 'L', rows: [{ name: 'English' }] }])).toThrow(/level/)
  })
  it('accepts download on the value variant', () => {
    const c = parse([entry], 'projects', { ...about, lines: [{ label: 'CV', value: 'Get', href: 'cv.pdf', download: true }] })
    expect(c.about.lines[0].download).toBe(true)
  })
  it('rejects download or href with rows', () => {
    expect(withLines([{ label: 'L', rows, download: true }])).toThrow(/rows/)
    expect(withLines([{ label: 'L', rows, href: 'x' }])).toThrow(/rows/)
  })
})

describe('summary and media', () => {
  it('accepts summary and media with string and translatable alt', () => {
    const c = parse([
      { ...entry, summary: { en: 's' }, media: [{ src: 'a.svg', alt: 'x' }, { src: 'b.svg', alt: { en: 'y' } }, { src: 'c.svg', alt: '' }] },
    ])
    expect(c.sections[0].entries[0].media).toHaveLength(3)
  })
  it('rejects video media', () => {
    expect(() => parse([{ ...entry, media: [{ src: 'a.mp4', type: 'video' }] }])).toThrow()
  })
  it('rejects media without src', () => {
    expect(() => parse([{ ...entry, media: [{ alt: 'x' }] }])).toThrow()
  })
})
