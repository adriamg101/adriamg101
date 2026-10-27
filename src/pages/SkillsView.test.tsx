import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Skill } from '../lib/skills'
import { sections, testAbout as about } from '../test-fixtures'
import { markPagesSeen, renderApp } from '../test-utils'
import { SkillsView } from './SkillsView'

const skills: Skill[] = [
  { key: 'react', name: 'React', category: 'frameworks' },
  { key: 'zsh', name: 'Zsh', category: 'tools' },
  { key: 'python', name: 'Python', category: 'languages' },
  { key: 'git', name: 'Git', category: 'tools' },
  { key: 'c', name: 'C', category: 'languages' },
]

const setup = () =>
  renderApp(<SkillsView about={about} skills={skills} />, { sections, skills, pageId: 'skills' })

beforeEach(() => localStorage.clear())

describe('SkillsView', () => {
  beforeEach(() => markPagesSeen('skills'))

  it('shows the command, one sr-only h1 and a plain heading', () => {
    const { container } = setup()
    expect(screen.getAllByText('show skills --all').length).toBeGreaterThan(0)
    const h1 = container.querySelectorAll('h1')
    expect(h1).toHaveLength(1)
    expect(h1[0]).toHaveClass('sr-only')
    expect(h1[0]).toHaveTextContent('Skills')
    expect(container.querySelector('h2.section-heading a')).toBeNull()
  })

  it('groups languages, tools, frameworks, alphabetical inside', () => {
    const { container } = setup()
    expect([...container.querySelectorAll('h3')].map((h) => h.textContent)).toEqual(['Languages', 'Tools', 'Frameworks'])
    expect([...container.querySelectorAll('button.skill-chip')].map((b) => b.textContent)).toEqual([
      'C',
      'Python',
      'Git',
      'Zsh',
      'React',
    ])
  })

  it('opens the panel on chip click', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Python' }))
    expect(within(await screen.findByRole('dialog')).getByText('Python')).toBeInTheDocument()
  })
})

describe('SkillsView animation', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
  it('starts typing immediately (not scroll gated)', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(1)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ top: 5000, bottom: 5100, left: 0, right: 0, width: 0, height: 100, x: 0, y: 5000, toJSON() {} }) as DOMRect,
    )
    const { container } = setup()
    for (let i = 0; i < 20; i++) act(() => void vi.advanceTimersByTime(100))
    expect(container.querySelector('.prompt-line [aria-hidden="true"]')!.textContent).not.toBe('u@h:~$ ')
  })
})
