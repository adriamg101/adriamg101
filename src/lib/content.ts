import aboutData from '../data/about.json'
import projects from '../data/projects.json'
import experience from '../data/experience.json'
import education from '../data/education.json'
import hobbies from '../data/hobbies.json'
import skills from '../data/skills.json'
import type { UiKey } from './i18n'
import { parseContent } from './schema'
import type { Content, Entry } from './schema'

export function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    if (a.start === b.start) return 0
    if (!a.start) return 1
    if (!b.start) return -1
    return a.start < b.start ? 1 : -1
  })
}

export function missingTranslations(c: Content): string[] {
  const out: string[] = []
  const check = (where: string, field: string, t: { es?: string; ca?: string } | undefined) => {
    if (!t) return
    for (const l of ['es', 'ca'] as const) if (!t[l]) out.push(`${where}: ${field}.${l}`)
  }
  check('about', 'tagline', c.about.tagline)
  check('about', 'bio', c.about.bio)
  c.about.lines.forEach((l, i) => {
    if (typeof l.label !== 'string') check('about', `lines[${i}].label`, l.label)
    if (l.value !== undefined && typeof l.value !== 'string') check('about', `lines[${i}].value`, l.value)
    l.rows?.forEach((r, j) => {
      if (typeof r.name !== 'string') check('about', `lines[${i}].rows[${j}].name`, r.name)
      if (typeof r.level !== 'string') check('about', `lines[${i}].rows[${j}].level`, r.level)
    })
  })
  for (const s of c.sections) {
    for (const e of s.entries) {
      const where = `${s.key}/${e.id}`
      check(where, 'title', e.title)
      check(where, 'description', e.description)
      check(where, 'summary', e.summary)
      e.media?.forEach((m, i) => {
        if (m.alt && typeof m.alt !== 'string') check(where, `media[${i}].alt`, m.alt)
      })
      e.downloads?.forEach((d, i) => check(where, `downloads[${i}].label`, d.label))
      check(where, 'role', e.role)
      check(where, 'degree', e.degree)
    }
  }
  return out
}

const sectionDefs: { key: string; titleKey: UiKey; file: unknown }[] = [
  { key: 'experience', titleKey: 'section.experience', file: experience },
  { key: 'projects', titleKey: 'section.projects', file: projects },
  { key: 'education', titleKey: 'section.education', file: education },
  { key: 'hobbies', titleKey: 'section.hobbies', file: hobbies },
]

const parsed = parseContent({
  about: aboutData,
  sections: sectionDefs.map((d) => ({ key: d.key, titleKey: d.titleKey, data: d.file })),
  skills,
})

export const content: Content = {
  ...parsed,
  sections: parsed.sections.map((s) => ({ ...s, entries: sortEntries(s.entries) })),
}
