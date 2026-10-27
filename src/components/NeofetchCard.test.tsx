import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsProvider, useSettings } from '../lib/settings'
import type { About } from '../lib/schema'
import { NeofetchCard } from './NeofetchCard'

const about: About = {
  name: 'Ada Lovelace',
  tagline: { en: 'Engineer', es: 'Ingeniera' },
  bio: { en: 'English bio', es: 'Bio en español' },
  photo: 'me.jpg',
  prompt: { user: 'ada', host: 'portfolio' },
  lines: [
    { label: 'Location', value: 'Barcelona' },
    { label: { en: 'Role', es: 'Rol' }, value: { en: 'Developer' } },
    { label: 'GitHub', value: 'adriamg101', href: 'https://github.com/adriamg101' },
    { label: 'Email', value: 'a@b.c', href: 'mailto:a@b.c' },
    { label: 'CV', value: 'Get CV', href: 'cv.pdf', download: true },
    { label: 'Abs', value: 'Abs CV', href: 'https://x.test/cv.pdf', download: true },
    {
      label: { en: 'Languages', es: 'Idiomas' },
      rows: [
        { name: { en: 'Spanish', es: 'Castellano' }, level: { en: 'Native', es: 'Nativo' } },
        { name: 'English', level: 'B2' },
      ],
    },
  ],
}

function Es() {
  const { setLang } = useSettings()
  return <button onClick={() => setLang('es')}>go-es</button>
}

function renderCard() {
  localStorage.clear()
  return render(
    <SettingsProvider>
      <Es />
      <NeofetchCard about={about} />
    </SettingsProvider>,
  )
}

describe('NeofetchCard', () => {
  beforeEach(() => vi.stubEnv('BASE_URL', '/adriamg101/'))
  afterEach(() => vi.unstubAllEnvs())

  it('renders the photo with name alt and base-aware src', () => {
    const { container } = renderCard()
    const img = container.querySelector('.neofetch img.neofetch-photo')
    expect(img).toHaveAttribute('alt', 'Ada Lovelace')
    expect(img).toHaveAttribute('src', '/adriamg101/me.jpg')
  })

  it('shows the name as the single visible h1 inside the card, before the lines', () => {
    const { container } = renderCard()
    const h1 = container.querySelector('.neofetch h1.neofetch-name')!
    expect(h1).toHaveTextContent('Ada Lovelace')
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('h1.sr-only')).toBeNull()
    expect(h1.compareDocumentPosition(container.querySelector('dl')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('gives the photo intrinsic dimensions to avoid layout shift', () => {
    const { container } = renderCard()
    const img = container.querySelector('img.neofetch-photo')!
    expect(img).toHaveAttribute('width', '180')
    expect(img).toHaveAttribute('height', '180')
  })

  it('keeps only dt/dd groups inside the dl, with the name outside it', () => {
    const { container } = renderCard()
    const dl = container.querySelector('dl')!
    expect([...dl.children].every((c) => c.tagName === 'DIV')).toBe(true)
    expect(dl.querySelector('h1')).toBeNull()
  })

  it('has no user@host header and no dashes separator', () => {
    const { container } = renderCard()
    expect(screen.queryByText('ada@portfolio')).toBeNull()
    expect(container.textContent).not.toContain('ada@')
    expect(container.textContent).not.toMatch(/-{3,}/)
    expect(container.querySelector('.neofetch-header, .neofetch-sep')).toBeNull()
  })

  it('renders tagline and every line', () => {
    renderCard()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Barcelona')).toBeInTheDocument()
    expect(screen.getByText('Developer')).toBeInTheDocument()
  })

  it('links only lines with href', () => {
    renderCard()
    const gh = screen.getByRole('link', { name: 'adriamg101' })
    expect(gh).toHaveAttribute('href', 'https://github.com/adriamg101')
    expect(gh).toHaveAttribute('target', '_blank')
    expect(gh).toHaveAttribute('rel', 'noopener noreferrer')
    const mail = screen.getByRole('link', { name: 'a@b.c' })
    expect(mail).not.toHaveAttribute('target')
    expect(mail).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: 'Barcelona' })).toBeNull()
  })

  it('renders rows as a headless two-cell table', async () => {
    const { container } = renderCard()
    const table = container.querySelector('table.neofetch-table')!
    expect(table.closest('dd')).not.toBeNull()
    expect(table.querySelectorAll('tr')).toHaveLength(2)
    expect([...table.querySelectorAll('tr')].every((r) => r.querySelectorAll('td').length === 2)).toBe(true)
    expect(table.querySelector('thead, caption, th')).toBeNull()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    await userEvent.click(screen.getByText('go-es'))
    expect(screen.getByText('Castellano')).toBeInTheDocument()
    expect(screen.getByText('Nativo')).toBeInTheDocument()
    expect(screen.getByText('B2')).toBeInTheDocument()
  })

  it('names the table after the line label in the current language', async () => {
    renderCard()
    expect(screen.getByRole('table', { name: 'Languages' })).toBeInTheDocument()
    await userEvent.click(screen.getByText('go-es'))
    expect(screen.getByRole('table', { name: 'Idiomas' })).toBeInTheDocument()
  })

  it('resolves download hrefs like assets for assorted inputs', () => {
    const cases: [string, string][] = [
      ['./cv.pdf', '/adriamg101/cv.pdf'],
      ['/cv.pdf', '/adriamg101/cv.pdf'],
      ['tel:+34123', 'tel:+34123'],
      ['data:application/pdf;base64,AA==', 'data:application/pdf;base64,AA=='],
      ['//host/cv.pdf', '//host/cv.pdf'],
    ]
    for (const [href, want] of cases) {
      const { unmount } = render(
        <SettingsProvider>
          <NeofetchCard about={{ ...about, lines: [{ label: 'CV', value: 'dl', href, download: true }] }} />
        </SettingsProvider>,
      )
      expect(screen.getByRole('link', { name: 'dl' })).toHaveAttribute('href', want)
      unmount()
    }
  })

  it('renders a download link with a base-aware href and no target', () => {
    renderCard()
    const cv = screen.getByRole('link', { name: 'Get CV' })
    expect(cv).toHaveAttribute('download')
    expect(cv).not.toHaveAttribute('target')
    expect(cv).toHaveAttribute('href', '/adriamg101/cv.pdf')
    const abs = screen.getByRole('link', { name: 'Abs CV' })
    expect(abs).toHaveAttribute('href', 'https://x.test/cv.pdf')
    expect(abs).toHaveAttribute('download')
    expect(screen.getByRole('link', { name: 'a@b.c' })).toHaveAttribute('href', 'mailto:a@b.c')
    expect(screen.getByRole('link', { name: 'adriamg101' })).toHaveAttribute('href', 'https://github.com/adriamg101')
  })

  it('renders Spanish with English fallback', async () => {
    renderCard()
    await userEvent.click(screen.getByText('go-es'))
    expect(screen.getByText('Ingeniera')).toBeInTheDocument()
    expect(screen.getByText('Rol')).toBeInTheDocument()
    expect(screen.getByText('Developer')).toBeInTheDocument()
  })

  it('leaves the bio to the home page', () => {
    const { container } = renderCard()
    expect(container.querySelector('.neofetch-bio')).toBeNull()
  })
})
