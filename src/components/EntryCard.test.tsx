import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import type { Skill } from '../lib/skills'
import { entry } from '../test-fixtures'
import { renderApp } from '../test-utils'
import { EntryCard } from './EntryCard'
import { useSettings } from '../lib/settings'

function Es() {
  const { setLang } = useSettings()
  return <button onClick={() => setLang('es')}>go-es</button>
}
function Where() {
  return <output data-testid="where">{useLocation().pathname}</output>
}

function renderCard(e: ReturnType<typeof entry>, skills: Skill[] = []) {
  localStorage.clear()
  return renderApp(
    <>
      <Where />
      <EntryCard entry={e} sectionKey="projects" />
    </>,
    { skills },
  )
}

describe('EntryCard dates', () => {
  it('renders the localized word for a present end', async () => {
    localStorage.clear()
    renderApp(
      <>
        <Es />
        <EntryCard entry={entry('x', { start: '2020-01', end: 'present', languages: ['Go'], tools: ['Go'] })} sectionKey="projects" />
      </>,
    )
    expect(screen.getByText('2020-01 – present')).toBeInTheDocument()
    await userEvent.click(screen.getByText('go-es'))
    expect(screen.getByText('2020-01 – actualidad')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Go' })).toHaveLength(1)
  })
})

describe('EntryCard link card', () => {
  it('links the title to the detail route', () => {
    renderCard(entry('foo'))
    const link = screen.getByRole('link', { name: 'Title foo' })
    expect(link).toHaveAttribute('href', '/projects/foo')
    expect(link).toHaveClass('entry-card-link')
    expect(screen.getByRole('heading', { level: 3 })).toContainElement(link)
  })

  it('shows the summary in full', () => {
    renderCard(entry('x', { summary: { en: 'A full summary sentence. And another one.' }, description: { en: 'Long one\n\nSecond' } }))
    const p = screen.getByText('A full summary sentence. And another one.')
    expect(p).toHaveClass('entry-summary')
    expect(p).not.toHaveAttribute('data-fallback')
  })

  it('falls back to the first paragraph and never shows the second', () => {
    renderCard(entry('x', { description: { en: 'First para\n\nSecond para' } }))
    expect(screen.getByText('First para')).toHaveAttribute('data-fallback', 'true')
    expect(screen.queryByText('Second para')).toBeNull()
  })

  it('has no external links, id or tabIndex', () => {
    renderCard(entry('x', { links: [{ label: 'Repo', url: 'https://example.com' }] }))
    expect(screen.getAllByRole('link')).toHaveLength(1)
    const card = document.querySelector('article.entry-card')!
    expect(card).not.toHaveAttribute('id')
    expect(card).not.toHaveAttribute('tabindex')
  })

  it('shows the cover image with the title as alt', () => {
    renderCard(entry('x', { image: 'cover.png' }))
    expect(screen.getByAltText('Title x')).toBeInTheDocument()
  })

  it('shows the subtitle', () => {
    renderCard(entry('x', { institution: 'Uni', degree: { en: 'BSc' } }))
    expect(screen.getByText('Uni · BSc')).toBeInTheDocument()
  })
})

describe('EntryCard tags', () => {
  it('shows the canonical skill name', () => {
    renderCard(entry('x', { languages: ['c#'] }), [{ key: 'c#', name: 'C#', category: 'languages' }])
    expect(screen.getByRole('button', { name: 'C#' })).toBeInTheDocument()
  })

  it('falls back to the raw tag when no skill is found', () => {
    renderCard(entry('x', { languages: ['Zig'] }))
    expect(screen.getByRole('button', { name: 'Zig' })).toBeInTheDocument()
  })

  it('renders one chip for a tag repeated across categories', () => {
    renderCard(entry('x', { languages: ['SQL'], tools: ['sql'] }))
    expect(screen.getAllByRole('button', { name: /sql/i })).toHaveLength(1)
  })

  it('skips tags with an empty key', () => {
    renderCard(entry('x', { tools: ['日本語'] }))
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('opens the skill panel without navigating', async () => {
    renderCard(entry('x', { languages: ['Go'] }))
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent('/')
    expect(screen.getByTestId('where').textContent).toBe('/')
  })
})

describe('EntryCard cover', () => {
  it('hides a cover image that fails to load', () => {
    renderCard(entry('x', { image: 'missing.png' }))
    const img = screen.getByRole('img')
    fireEvent.error(img)
    expect(img).toHaveStyle({ display: 'none' })
  })
})
