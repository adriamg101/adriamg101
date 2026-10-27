import { useSettings, useT } from '../lib/settings'

export function ThemeToggle() {
  const { theme, toggleTheme } = useSettings()
  const t = useT()
  return (
    <button type="button" className="theme-toggle" aria-label={t('theme.toggle')} onClick={toggleTheme}>
      {theme === 'dark' ? '☾' : '☀'}
    </button>
  )
}
