import { pickText } from './i18n'
import type { Entry, Lang } from './schema'

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function entryFileName(entry: Pick<Entry, 'id' | 'title'>): string {
  return slugify(entry.title.en) || entry.id
}

export function entrySubtitle(entry: Entry, lang: Lang): string {
  if (entry.organization && entry.role) return `${entry.organization} · ${pickText(entry.role, lang)}`
  if (entry.institution && entry.degree) return `${entry.institution} · ${pickText(entry.degree, lang)}`
  return ''
}

export function descriptionParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function entrySummary(entry: Entry, lang: Lang): string {
  if (entry.summary) return pickText(entry.summary, lang)
  return descriptionParagraphs(pickText(entry.description, lang))[0] ?? ''
}
