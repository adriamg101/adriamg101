import type { Entry, Section, SkillCategory, SkillOverrides } from './schema'

export type Skill = { key: string; name: string; category: SkillCategory; icon?: string }

const CATEGORIES: SkillCategory[] = ['languages', 'tools', 'frameworks']

export function normalizeSkillKey(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9+#]/g, '')
}

export function collectSkills(sections: Section[], overrides: SkillOverrides): Skill[] {
  const found = new Map<string, Skill>()
  const byKey = new Map(Object.entries(overrides).map(([k, v]) => [normalizeSkillKey(k), v]))
  for (const section of sections) {
    for (const entry of section.entries) {
      for (const category of CATEGORIES) {
        for (const raw of entry[category]) {
          const key = normalizeSkillKey(raw)
          if (!key || found.has(key)) continue
          const o = byKey.get(key)
          const skill: Skill = { key, name: o?.name ?? raw.trim(), category: o?.category ?? category }
          if (o?.icon) skill.icon = o.icon
          found.set(key, skill)
        }
      }
    }
  }
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function groupSkills(skills: Skill[]): { category: SkillCategory; skills: Skill[] }[] {
  return CATEGORIES.map((category) => ({
    category,
    skills: skills.filter((s) => s.category === category).sort((a, b) => a.name.localeCompare(b.name, 'en')),
  })).filter((g) => g.skills.length > 0)
}

type Group = { section: Section; entries: Entry[] }

function group(sections: Section[], keep: (e: Entry) => boolean): Group[] {
  return sections
    .map((section) => ({ section, entries: section.entries.filter(keep) }))
    .filter((g) => g.entries.length > 0)
}

export function usagesOf(key: string, sections: Section[]): Group[] {
  return group(sections, (e) =>
    CATEGORIES.some((c) => e[c].some((n) => normalizeSkillKey(n) === key)),
  )
}

export function homeEntries(sections: Section[]): Group[] {
  return group(sections, (e) => e.home)
}

export function unusedOverrideKeys(sections: Section[], overrides: SkillOverrides): string[] {
  const used = new Set<string>()
  for (const s of sections)
    for (const e of s.entries) for (const c of CATEGORIES) for (const n of e[c]) used.add(normalizeSkillKey(n))
  return Object.keys(overrides).filter((k) => !used.has(normalizeSkillKey(k)))
}

export function emptyKeyTags(sections: Section[]): string[] {
  const out: string[] = []
  for (const s of sections)
    for (const e of s.entries)
      for (const c of CATEGORIES)
        for (const n of e[c]) if (!normalizeSkillKey(n)) out.push(`${s.key}/${e.id}: "${n}"`)
  return out
}
