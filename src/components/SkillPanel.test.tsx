import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, useLocation } from 'react-router-dom'
import { SettingsProvider } from '../lib/settings'
import type { Section } from '../lib/schema'
import type { Skill } from '../lib/skills'
import { entry } from '../test-fixtures'
import { SkillPanelProvider, useSkillPanel } from './SkillPanel'

const sections: Section[] = [
  { key: 'projects', titleKey: 'section.projects', entries: [entry('p1', { languages: ['Python'] }), entry('p2', { tools: ['Git'] })] },
  {
    key: 'experience',
    titleKey: 'section.experience',
    entries: [
      entry('e1', { tools: ['Git'], organization: 'Acme', role: { en: 'Dev' }, summary: { en: 'Should not show' } }),
    ],
  },
  { key: 'education', titleKey: 'section.education', entries: [entry('uni', { languages: ['Python'] })] },
]
const skills: Skill[] = [{ key: 'python', name: 'Python', category: 'languages' }]

function Opener({ k }: { k: string }) {
  const { openSkill } = useSkillPanel()
  return <button onClick={() => openSkill(k)}>open</button>
}

function Probe() {
  return <p data-testid="loc">{useLocation().pathname}</p>
}

function setup(k = 'python') {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <SkillPanelProvider sections={sections} skills={skills}>
          <Opener k={k} />
          <Opener k="git" />
          <Link to="/elsewhere">away</Link>
          <Probe />
        </SkillPanelProvider>
      </SettingsProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => localStorage.clear())

describe('SkillPanel', () => {
  it('shows usage groups for the skill', async () => {
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: 'open' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Python' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Experience' })).toBeNull()
    expect(screen.getByRole('link', { name: /Title p1/ }).getAttribute('href')).toMatch(/\/projects\/p1$/)
    expect(screen.getByRole('link', { name: /Title uni/ }).getAttribute('href')).toMatch(/\/education\/uni$/)
  })

  it('renders items as compact cards with the summary line, or the subtitle when present', async () => {
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: 'open' })[1])
    const p2 = screen.getByRole('link', { name: /Title p2/ })
    expect(p2).toHaveClass('compact-card')
    expect(p2).toHaveTextContent('Title p2')
    expect(p2).toHaveTextContent('Desc p2')
    const e1 = screen.getByRole('link', { name: /Title e1/ })
    expect(e1).toHaveClass('compact-card')
    expect(e1).toHaveTextContent('Acme · Dev')
    expect(e1).not.toHaveTextContent('Should not show')
    expect(e1.querySelector('img, time, button')).toBeNull()
  })

  it('moves focus in and restores it on close', async () => {
    setup()
    const opener = screen.getAllByRole('button', { name: 'open' })[0]
    await userEvent.click(opener)
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
    await userEvent.keyboard('{Escape}')
    expect(opener).toHaveFocus()
  })

  it('closes on Esc', async () => {
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: 'open' })[0])
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on backdrop click', async () => {
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: 'open' })[0])
    await userEvent.click(screen.getByTestId('skill-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on close button', async () => {
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: 'open' })[0])
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes when an item is clicked', async () => {
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: 'open' })[0])
    await userEvent.click(screen.getByRole('link', { name: /Title p1/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('loc')).toHaveTextContent('/projects/p1')
  })

  it('does not change scroll position and restores body overflow', async () => {
    window.scrollY = 120
    document.body.style.overflow = 'auto'
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: 'open' })[0])
    expect(document.body.style.overflow).toBe('hidden')
    await userEvent.keyboard('{Escape}')
    expect(window.scrollY).toBe(120)
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })

  it('shows the empty message for an unknown key', async () => {
    setup('nope')
    await userEvent.click(screen.getAllByRole('button', { name: 'open' })[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Nothing to show for this skill yet.')).toBeInTheDocument()
  })

  it('traps Tab and Shift+Tab inside the dialog', async () => {
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: 'open' })[0])
    const close = screen.getByRole('button', { name: 'Close' })
    const last = screen.getByRole('link', { name: /Title uni/ })
    expect(close).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(last).toHaveFocus()
    await userEvent.tab()
    expect(close).toHaveFocus()
  })

  it('switching skills updates content and restores the original opener', async () => {
    setup()
    const [a, b] = screen.getAllByRole('button', { name: 'open' })
    await userEvent.click(a)
    expect(screen.getByRole('dialog', { name: 'Python' })).toBeInTheDocument()
    act(() => {
      b.click()
    })
    expect(screen.getByRole('dialog', { name: 'git' })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
    await userEvent.keyboard('{Escape}')
    expect(a).toHaveFocus()
  })

  it('closes on route change not made via an item link', async () => {
    setup()
    document.body.style.overflow = ''
    await userEvent.click(screen.getAllByRole('button', { name: 'open' })[0])
    act(() => {
      screen.getByRole('link', { name: 'away', hidden: true }).click()
    })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })
})
