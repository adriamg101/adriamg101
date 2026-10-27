import type { Lang, Translatable } from './schema'

export type UiKey =
  | 'section.projects'
  | 'section.experience'
  | 'section.education'
  | 'section.hobbies'
  | 'neofetch.tagline'
  | 'nav.home'
  | 'home.skills'
  | 'panel.usedIn'
  | 'panel.close'
  | 'theme.toggle'
  | 'lang.label'
  | 'empty.skill'
  | 'date.present'
  | 'nav.top'
  | 'skills.languages'
  | 'skills.tools'
  | 'skills.frameworks'

export const ui: Record<Lang, Record<UiKey, string>> = {
  en: {
    'section.projects': 'Projects',
    'section.experience': 'Experience',
    'section.education': 'Education',
    'section.hobbies': 'Hobbies',
    'neofetch.tagline': 'About',
    'nav.home': 'Home',
    'home.skills': 'Skills',
    'panel.usedIn': 'Used in',
    'panel.close': 'Close',
    'theme.toggle': 'Toggle theme',
    'lang.label': 'Language',
    'empty.skill': 'Nothing to show for this skill yet.',
    'date.present': 'present',
    'nav.top': 'Back to top',
    'skills.languages': 'Languages',
    'skills.tools': 'Tools',
    'skills.frameworks': 'Frameworks',
  },
  es: {
    'section.projects': 'Proyectos',
    'section.experience': 'Experiencia',
    'section.education': 'Formación',
    'section.hobbies': 'Aficiones',
    'neofetch.tagline': 'Sobre mí',
    'nav.home': 'Inicio',
    'home.skills': 'Habilidades',
    'panel.usedIn': 'Usado en',
    'panel.close': 'Cerrar',
    'theme.toggle': 'Cambiar tema',
    'lang.label': 'Idioma',
    'empty.skill': 'Todavía no hay nada que mostrar para esta habilidad.',
    'date.present': 'actualidad',
    'nav.top': 'Volver arriba',
    'skills.languages': 'Lenguajes',
    'skills.tools': 'Herramientas',
    'skills.frameworks': 'Frameworks',
  },
  ca: {
    'section.projects': 'Projectes',
    'section.experience': 'Experiència',
    'section.education': 'Formació',
    'section.hobbies': 'Aficions',
    'neofetch.tagline': 'Sobre mi',
    'nav.home': 'Inici',
    'home.skills': 'Habilitats',
    'panel.usedIn': 'Utilitzat a',
    'panel.close': 'Tanca',
    'theme.toggle': 'Canvia el tema',
    'lang.label': 'Idioma',
    'empty.skill': 'Encara no hi ha res per mostrar d’aquesta habilitat.',
    'date.present': 'actualitat',
    'nav.top': 'Torna amunt',
    'skills.languages': 'Llenguatges',
    'skills.tools': 'Eines',
    'skills.frameworks': 'Frameworks',
  },
}

export function pickText(t: Translatable | string, lang: Lang): string {
  if (typeof t === 'string') return t
  return t[lang] || t.en
}
