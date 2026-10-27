import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettings } from '../lib/settings'
import type { Skill } from '../lib/skills'
import { content } from '../lib/content'
import { sections, testAbout as about } from '../test-fixtures'
import { markPagesSeen, renderApp } from '../test-utils'
import { HomePage } from './HomePage'

const react: Skill = { key: 'react', name: 'React', category: 'frameworks' }

function Es() {
  const { setLang } = useSettings()
  return <button onClick={() => setLang('es')}>go-es</button>
}

function setup(over: { skills?: Skill[]; sections?: typeof sections } = {}) {
  const s = over.sections ?? sections
  const sk = over.skills ?? [react]
  return renderApp(
    <>
      <Es />
      <HomePage about={about} skills={sk} sections={s} />
    </>,
    { sections: s, skills: sk },
  )
}

beforeEach(() => {
  localStorage.clear()
  markPagesSeen('home')
})

const blockIds = (c: HTMLElement) => [...c.querySelectorAll('.prompt-block')].map((b) => b.id)

describe('HomePage', () => {
  it('renders neofetch first, then the bio, then skills, then sections with flagged entries only', () => {
    const { container } = setup()
    expect(blockIds(container)).toEqual(['block-neofetch', 'block-bio', 'block-skills', 'block-projects'])
    expect(screen.queryByText('ls education')).toBeNull()
    expect(screen.queryByText('ls experience')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Education' })).toBeNull()
  })

  it('shows only the flagged entries', () => {
    const { container } = setup()
    expect(container.querySelector('a[href="/projects/foo"]')).not.toBeNull()
    expect(container.querySelector('a[href="/projects/bar"]')).toBeNull()
    expect(container.querySelector('a[href="/education/uni"]')).toBeNull()
    expect(container.querySelector('#block-projects .entry-grid')).not.toBeNull()
  })

  it('has block headings as links and --all link-lines with the right hrefs', () => {
    const { container } = setup()
    expect(screen.getByRole('link', { name: 'Skills' })).toHaveAttribute('href', '/skills')
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects')
    const lines = [...container.querySelectorAll('a.prompt-link')].map((a) => [a.textContent, a.getAttribute('href')])
    expect(lines).toEqual([
      ['u@h:~$ show skills --all', '/skills'],
      ['u@h:~$ ls projects --all', '/projects'],
    ])
  })

  it('shows about info in the neofetch card, with the only h1', () => {
    const { container } = setup()
    expect(screen.getByText('Dev')).toBeInTheDocument()
    const h1 = container.querySelectorAll('h1')
    expect(h1).toHaveLength(1)
    expect(h1[0]).toHaveTextContent('Ada')
  })

  it('omits the skills step without skills', () => {
    const { container } = setup({ skills: [] })
    expect(blockIds(container)).not.toContain('block-skills')
    expect(screen.queryByText('show skills')).toBeNull()
    expect(container.querySelector('a[href="/skills"]')).toBeNull()
  })

  it('opens the skill panel from the marquee', async () => {
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: /react/i })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('renders descriptions in Spanish, falling back to English', async () => {
    const s = [
      { ...sections[0], entries: [sections[0].entries[0], { ...sections[0].entries[1], home: true }] },
    ]
    setup({ sections: s })
    expect(screen.getByText('Desc foo')).toBeInTheDocument()
    await userEvent.click(screen.getByText('go-es'))
    expect(screen.getByText('Descripcion foo')).toBeInTheDocument()
    expect(screen.getByText('Only English bar')).toBeInTheDocument()
  })
})

describe('HomePage with the shipped content', () => {
  it('renders a block for every section with a flagged entry and none for the others', () => {
    markPagesSeen('home')
    const { container } = renderApp(
      <HomePage about={content.about} skills={[]} sections={content.sections} />,
      { sections: content.sections },
    )
    for (const s of content.sections) {
      const featured = s.entries.some((e) => e.home)
      const block = container.querySelector(`#block-${s.key} .entry-grid`)
      expect(block !== null, `section ${s.key}`).toBe(featured)
    }
  })
})

describe('HomePage scroll gating', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(1)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ top: 5000, bottom: 5100, left: 0, right: 0, width: 0, height: 100, x: 0, y: 5000, toJSON() {} }) as DOMRect,
    )
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('gives the bio prompt its turn but does not type it before it is reached', () => {
    const { container } = setup()
    for (let i = 0; i < 400; i++) act(() => void vi.advanceTimersByTime(20))
    const bio = container.querySelector('#block-bio')
    expect(bio).not.toBeNull()
    expect(bio!.querySelector('.prompt-cursor')).toHaveAttribute('data-state', 'idle')
    expect(bio!.querySelector('.prompt-line [aria-hidden="true"]')!.textContent).toBe('u@h:~$ ')
  })
})
