import { useSettings, useT } from '../lib/settings'
import type { Lang } from '../lib/schema'

const LANGS: Lang[] = ['en', 'es', 'ca']

export function LanguageSwitch() {
  const { lang, setLang } = useSettings()
  const t = useT()
  return (
    <div className="lang-switch" role="group" aria-label={t('lang.label')}>
      {LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
