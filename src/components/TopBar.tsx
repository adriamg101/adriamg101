import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useT } from '../lib/settings'
import type { Section } from '../lib/schema'
import { LanguageSwitch } from './LanguageSwitch'
import { ThemeToggle } from './ThemeToggle'

export function TopBar({ sections, hasSkills = true }: { sections: Section[]; hasSkills?: boolean }) {
  const t = useT()
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      document.documentElement.style.setProperty(
        '--topbar-height',
        `${el.getBoundingClientRect().height || el.offsetHeight}px`,
      )
    }
    measure()
    if (typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <header className="topbar" ref={ref}>
      <nav>
        <NavLink to="/" end>
          {t('nav.home')}
        </NavLink>
        {hasSkills && <NavLink to="/skills">{t('home.skills')}</NavLink>}
        {sections
          .filter((s) => s.entries.length > 0)
          .map((s) => (
            <NavLink key={s.key} to={`/${s.key}`}>
              {t(s.titleKey)}
            </NavLink>
          ))}
      </nav>
      <LanguageSwitch />
      <ThemeToggle />
    </header>
  )
}
