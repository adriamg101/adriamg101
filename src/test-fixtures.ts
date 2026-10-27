import type { Entry, Section } from './lib/schema'

export function entry(id: string, over: Partial<Entry> = {}): Entry {
  return {
    id,
    title: { en: `Title ${id}` },
    description: { en: `Desc ${id}`, es: `Descripcion ${id}` },
    languages: [],
    tools: [],
    frameworks: [],
    home: false,
    ...over,
  }
}

export const sections: Section[] = [
  { key: 'projects', titleKey: 'section.projects', entries: [entry('foo', { home: true }), entry('bar', { description: { en: 'Only English bar' } })] },
  { key: 'experience', titleKey: 'section.experience', entries: [] },
  { key: 'education', titleKey: 'section.education', entries: [entry('uni')] },
  { key: 'hobbies', titleKey: 'section.hobbies', entries: [] },
]

export const testAbout: import('./lib/schema').About = {
  name: 'Ada',
  tagline: { en: 'Dev' },
  bio: { en: 'Bio text' },
  photo: 'p.svg',
  prompt: { user: 'u', host: 'h' },
  lines: [],
}
