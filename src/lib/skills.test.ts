import { collectSkills, emptyKeyTags, groupSkills, homeEntries, normalizeSkillKey, unusedOverrideKeys, usagesOf } from './skills'
import type { Entry, Section } from './schema'

const mk = (id: string, p: Partial<Entry> = {}): Entry => ({
  id,
  title: { en: id },
  description: { en: id },
  languages: [],
  tools: [],
  frameworks: [],
  home: false,
  ...p,
})
const sec = (key: string, entries: Entry[]): Section => ({ key, titleKey: key as never, entries })

describe('normalizeSkillKey', () => {
  it('normalizes spellings', () => {
    expect(normalizeSkillKey(' React ')).toBe('react')
    expect(['Node.js', 'nodejs', 'NodeJS'].map(normalizeSkillKey)).toEqual(['nodejs', 'nodejs', 'nodejs'])
    expect(['C', 'C++', 'C#'].map(normalizeSkillKey)).toEqual(['c', 'c++', 'c#'])
  })
})

describe('collectSkills', () => {
  it('merges spellings into one skill', () => {
    const s = collectSkills([sec('projects', [mk('a', { frameworks: ['React', 'react', ' React '] })])], {})
    expect(s).toHaveLength(1)
    expect(s[0]).toMatchObject({ key: 'react', name: 'React', category: 'frameworks' })
  })
  it('first category wins unless overridden', () => {
    const sections = [
      sec('projects', [mk('a', { languages: ['Python'] }), mk('b', { tools: ['Python'] })]),
    ]
    expect(collectSkills(sections, {})[0].category).toBe('languages')
    expect(collectSkills(sections, { python: { category: 'tools' } })[0].category).toBe('tools')
  })
  it('applies override name and icon, sorted by name', () => {
    const sections = [sec('projects', [mk('a', { tools: ['zed', 'react'] })])]
    const s = collectSkills(sections, { react: { name: 'React', icon: '/x.svg' } })
    expect(s.map((x) => x.name)).toEqual(['React', 'zed'])
    expect(s[0].icon).toBe('/x.svg')
  })
  it('handles empty input', () => {
    expect(collectSkills([], {})).toEqual([])
  })
})

describe('usagesOf / homeEntries', () => {
  const sections = [
    sec('experience', [mk('e', { tools: ['Git'] })]),
    sec('projects', [mk('p', { languages: ['Python'], home: true }), mk('q', { languages: ['python'] })]),
    sec('education', [mk('d', { languages: ['Python'] })]),
  ]
  it('groups usages in order, omitting empty', () => {
    const u = usagesOf('python', sections)
    expect(u.map((g) => g.section.key)).toEqual(['projects', 'education'])
    expect(u[0].entries.map((e) => e.id)).toEqual(['p', 'q'])
    expect(usagesOf('unknown', sections)).toEqual([])
  })
  it('homeEntries returns flagged only', () => {
    const h = homeEntries(sections)
    expect(h.map((g) => g.section.key)).toEqual(['projects'])
    expect(h[0].entries.map((e) => e.id)).toEqual(['p'])
  })
  it('empty sections', () => {
    expect(usagesOf('x', [])).toEqual([])
    expect(homeEntries([])).toEqual([])
  })
})

describe('override key normalization', () => {
  it('applies an override keyed by display name', () => {
    const s = collectSkills([sec('p', [mk('a', { languages: ['nodejs'] })])], {
      'Node.js': { name: 'Node.js', icon: '/icons/node.svg' },
    })
    expect(s[0]).toMatchObject({ key: 'nodejs', name: 'Node.js', icon: '/icons/node.svg' })
  })
})

describe('unusedOverrideKeys', () => {
  it('returns override keys matching no tag, in either spelling', () => {
    const sections = [sec('p', [mk('a', { languages: ['nodejs'] })])]
    expect(unusedOverrideKeys(sections, { 'Node.js': {}, 'C#': { name: 'C#' } })).toEqual(['C#'])
  })
})

describe('emptyKeyTags', () => {
  it('lists tags that normalize to an empty key', () => {
    const sections = [sec('p', [mk('a', { tools: ['日本語', 'Go'] })])]
    expect(emptyKeyTags(sections)).toEqual(['p/a: "日本語"'])
  })
})

describe('groupSkills', () => {
  it('orders groups, sorts by name and omits empty groups', () => {
    const s = (name: string, category: 'languages' | 'tools' | 'frameworks') => ({ key: name.toLowerCase(), name, category })
    const out = groupSkills([s('Vite', 'tools'), s('Rust', 'languages'), s('Bash', 'languages'), s('Git', 'tools')])
    expect(out.map((g) => g.category)).toEqual(['languages', 'tools'])
    expect(out[0].skills.map((x) => x.name)).toEqual(['Bash', 'Rust'])
    expect(out[1].skills.map((x) => x.name)).toEqual(['Git', 'Vite'])
  })
})
