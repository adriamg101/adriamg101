import { z } from 'zod'
import type { UiKey } from './i18n'

export type Lang = 'en' | 'es' | 'ca'
export type Translatable = { en: string; es?: string; ca?: string }
export type SkillCategory = 'languages' | 'tools' | 'frameworks'

const translatable = z.object({ en: z.string(), es: z.string().optional(), ca: z.string().optional() }).strict()
const link = z.object({ label: z.string(), url: z.string() }).strict()
const download = z.object({ label: translatable, file: z.string() }).strict()
const media = z.object({ src: z.string(), alt: z.union([z.string(), translatable]).optional() }).strict()
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM')
const end = z.union([month, z.literal('present')])

const entryShape = {
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*$/i, 'id must use only letters, digits and hyphens, and start with a letter or digit'),
  title: translatable,
  description: translatable,
  summary: translatable.optional(),
  media: z.array(media).optional(),
  start: month.optional(),
  end: end.optional(),
  links: z.array(link).optional(),
  downloads: z.array(download).optional(),
  image: z.string().optional(),
  languages: z.array(z.string()),
  tools: z.array(z.string()),
  frameworks: z.array(z.string()),
  home: z.boolean(),
}

const endNeedsStart = (e: { id: string; start?: string; end?: string }, ctx: z.RefinementCtx) => {
  if (e.end !== undefined && e.start === undefined) {
    ctx.addIssue({ code: 'custom', path: ['end'], message: `entry "${e.id}" has end but no start` })
  }
}

const baseEntry = z.object(entryShape).strict().superRefine(endNeedsStart)
const experienceEntry = z
  .object({ ...entryShape, organization: z.string(), role: translatable })
  .strict()
  .superRefine(endNeedsStart)
const educationEntry = z
  .object({ ...entryShape, institution: z.string(), degree: translatable })
  .strict()
  .superRefine(endNeedsStart)

export type Entry = z.infer<typeof baseEntry> &
  Partial<{ organization: string; role: Translatable; institution: string; degree: Translatable }>
export type ExperienceEntry = Entry & { organization: string; role: Translatable }
export type EducationEntry = Entry & { institution: string; degree: Translatable }
export type Section = { key: string; titleKey: UiKey; entries: Entry[] }

const textOrTranslatable = z.union([z.string(), translatable])
const aboutRow = z.object({ name: textOrTranslatable, level: textOrTranslatable }).strict()
const aboutLine = z
  .object({
    label: textOrTranslatable,
    value: textOrTranslatable.optional(),
    href: z.string().optional(),
    download: z.boolean().optional(),
    rows: z.array(aboutRow).min(1, 'rows must have at least one row').optional(),
  })
  .strict()
  .superRefine((l, ctx) => {
    const hasValue = l.value !== undefined
    const hasRows = l.rows !== undefined
    if (hasValue === hasRows) {
      ctx.addIssue({ code: 'custom', message: 'a line needs exactly one of "value" or "rows"' })
    }
    if (hasRows && (l.href !== undefined || l.download !== undefined)) {
      ctx.addIssue({ code: 'custom', message: 'a line with "rows" cannot have "href" or "download"' })
    }
  })
export type AboutRow = { name: string | Translatable; level: string | Translatable }
export type AboutLine =
  | { label: string | Translatable; value: string | Translatable; href?: string; download?: boolean; rows?: never }
  | { label: string | Translatable; rows: AboutRow[]; value?: never; href?: never; download?: never }

const aboutSchema = z
  .object({
    name: z.string(),
    tagline: translatable,
    bio: translatable,
    photo: z.string(),
    prompt: z.object({ user: z.string(), host: z.string() }).strict(),
    lines: z.array(aboutLine),
  })
  .strict()
export type About = {
  name: string
  tagline: Translatable
  bio: Translatable
  photo: string
  prompt: { user: string; host: string }
  lines: AboutLine[]
}

const skillsSchema = z.record(
  z.string(),
  z
    .object({
      name: z.string().optional(),
      category: z.enum(['languages', 'tools', 'frameworks']).optional(),
      icon: z.string().optional(),
    })
    .strict(),
)
export type SkillOverrides = z.infer<typeof skillsSchema>

export type Content = { about: About; sections: Section[]; skillOverrides: SkillOverrides }

function sectionSchema(key: string) {
  const item = key === 'experience' ? experienceEntry : key === 'education' ? educationEntry : baseEntry
  return z.array(item).superRefine((entries, ctx) => {
    const seen = new Set<string>()
    entries.forEach((e, i) => {
      if (seen.has(e.id)) {
        ctx.addIssue({ code: 'custom', path: [i, 'id'], message: `duplicate id "${e.id}"` })
      }
      seen.add(e.id)
    })
  })
}

function check<T>(label: string, schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  const details = result.error.issues
    .map((i) => `${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`)
    .join('; ')
  throw new Error(`Invalid content in ${label}: ${details}`)
}

export function parseContent(raw: {
  about: unknown
  sections: { key: string; titleKey: UiKey; data: unknown }[]
  skills: unknown
}): Content {
  return {
    about: check('about', aboutSchema, raw.about) as About,
    sections: raw.sections.map((s) => ({
      key: s.key,
      titleKey: s.titleKey,
      entries: check(s.key, sectionSchema(s.key), s.data) as Entry[],
    })),
    skillOverrides: check('skills', skillsSchema, raw.skills),
  }
}
