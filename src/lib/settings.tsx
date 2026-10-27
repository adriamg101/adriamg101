import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ui, type UiKey } from './i18n'
import type { Lang } from './schema'

type Theme = 'dark' | 'light'
type Settings = { lang: Lang; setLang(l: Lang): void; theme: Theme; toggleTheme(): void }

const LANG_KEY = 'portfolio.lang'
const THEME_KEY = 'portfolio.theme'

function readSetting(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage unavailable: setting stays in memory only
  }
}

function initialLang(): Lang {
  const v = readSetting(LANG_KEY)
  return v === 'en' || v === 'es' || v === 'ca' ? v : 'en'
}

function initialTheme(): Theme {
  const v = readSetting(THEME_KEY)
  return v === 'light' ? 'light' : 'dark'
}

const SettingsContext = createContext<Settings | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    writeSetting(LANG_KEY, l)
  }, [])
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark'
      writeSetting(THEME_KEY, next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ lang, setLang, theme, toggleTheme }), [lang, setLang, theme, toggleTheme])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}

export function useT(): (key: UiKey) => string {
  const { lang } = useSettings()
  return useCallback((key: UiKey) => ui[lang][key], [lang])
}
