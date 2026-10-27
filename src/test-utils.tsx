import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AnimationProvider } from './components/AnimationProvider'
import { SkillPanelProvider } from './components/SkillPanel'
import type { Section } from './lib/schema'
import { SettingsProvider } from './lib/settings'
import type { Skill } from './lib/skills'
import { writeRecord } from './lib/visit'

/** Writes a fresh animation record in which the given pages are already seen (they render without animation). */
export function markPagesSeen(...pageIds: string[]) {
  writeRecord({ startedAt: Date.now(), seen: pageIds })
}

export function renderApp(
  ui: ReactNode,
  {
    path = '/',
    sections = [],
    skills = [],
    pageId = 'home',
  }: { path?: string; sections?: Section[]; skills?: Skill[]; pageId?: string } = {},
) {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[path]}>
        <AnimationProvider pageId={pageId}>
          <SkillPanelProvider sections={sections} skills={skills}>
            {ui}
          </SkillPanelProvider>
        </AnimationProvider>
      </MemoryRouter>
    </SettingsProvider>,
  )
}
