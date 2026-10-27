import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { entrySubtitle, entrySummary } from '../lib/entry'
import { pickText } from '../lib/i18n'
import type { Section } from '../lib/schema'
import { useSettings, useT } from '../lib/settings'
import { usagesOf, type Skill } from '../lib/skills'
import { SectionHeading } from './SectionHeading'
import { SkillIcon } from './SkillIcon'

type PanelApi = { openSkill(key: string): void; close(): void; nameOf(key: string): string | undefined }

const SkillPanelContext = createContext<PanelApi | null>(null)

export function useSkillPanel(): PanelApi {
  const ctx = useContext(SkillPanelContext)
  if (!ctx) throw new Error('useSkillPanel must be used inside SkillPanelProvider')
  return ctx
}

export function SkillPanelProvider({
  sections,
  skills,
  children,
}: {
  sections: Section[]
  skills: Skill[]
  children: ReactNode
}) {
  const [key, setKey] = useState<string | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const isOpen = useRef(false)
  const { pathname } = useLocation()

  const openSkill = useCallback((k: string) => {
    if (!isOpen.current) {
      isOpen.current = true
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
    setKey(k)
  }, [])
  const close = useCallback(() => {
    isOpen.current = false
    setKey(null)
  }, [])

  useEffect(() => {
    close()
  }, [pathname, close])
  const api = useMemo(
    () => ({ openSkill, close, nameOf: (k: string) => skills.find((s) => s.key === k)?.name }),
    [openSkill, close, skills],
  )

  return (
    <SkillPanelContext.Provider value={api}>
      {children}
      {key !== null && (
        <Panel skillKey={key} sections={sections} skills={skills} onClose={close} returnFocus={returnFocus} />
      )}
    </SkillPanelContext.Provider>
  )
}

function Panel({
  skillKey,
  sections,
  skills,
  onClose,
  returnFocus,
}: {
  skillKey: string
  sections: Section[]
  skills: Skill[]
  onClose(): void
  returnFocus: { current: HTMLElement | null }
}) {
  const t = useT()
  const { lang } = useSettings()
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const skill = skills.find((s) => s.key === skillKey)
  const groups = usagesOf(skillKey, sections)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const items = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!dialogRef.current.contains(active)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const toRestore = returnFocus.current
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      toRestore?.focus({ preventScroll: true })
    }
  }, [onClose, returnFocus])

  useEffect(() => {
    closeRef.current?.focus()
  }, [skillKey])

  return (
    <div className="skill-panel-backdrop" data-testid="skill-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="skill-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="skill-panel-close" onClick={onClose}>
          {t('panel.close')}
        </button>
        <header className="skill-panel-header">
          {skill && <SkillIcon skill={skill} showLabel={false} />}
          <span id="skill-panel-title">{skill?.name ?? skillKey}</span>
        </header>
        {groups.length === 0 ? (
          <p>{t('empty.skill')}</p>
        ) : (
          groups.map(({ section, entries }) => (
            <section key={section.key}>
              <SectionHeading>{t(section.titleKey)}</SectionHeading>
              <ul className="compact-list">
                {entries.map((e) => (
                  <li key={e.id}>
                    <Link className="compact-card" to={`/${section.key}/${e.id}`} onClick={onClose}>
                      <span className="compact-card-title">{pickText(e.title, lang)}</span>
                      <span className="compact-card-line">{entrySubtitle(e, lang) || entrySummary(e, lang)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
