import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach } from 'vitest'
import { entry } from '../test-fixtures'
import { renderApp } from '../test-utils'
import { EntryDetail } from './EntryDetail'

const show = (e: ReturnType<typeof entry>) =>
  renderApp(<EntryDetail entry={e} sectionKey="projects" />)

describe('EntryDetail', () => {
  beforeEach(() => localStorage.clear())

  it('renders title, subtitle, dates, paragraphs and links', () => {
    show(
      entry('x', {
        organization: 'Acme',
        role: { en: 'Dev' },
        start: '2020-01',
        end: '2021-02',
        description: { en: 'First para.\n\nSecond para.' },
        links: [{ label: 'Repo', url: 'https://example.com' }],
      }),
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Title x' })).toBeInTheDocument()
    expect(screen.getByText('Acme · Dev')).toBeInTheDocument()
    expect(screen.getByText('2020-01 – 2021-02')).toBeInTheDocument()
    expect(screen.getByText('First para.').tagName).toBe('P')
    expect(screen.getByText('Second para.').tagName).toBe('P')
    const link = screen.getByRole('link', { name: 'Repo' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('uses media instead of image when media has items', () => {
    show(entry('x', { image: 'cover.png', media: [{ src: 'a.png', alt: { en: 'Alt A' } }, { src: 'b.png', alt: '' }, { src: 'c.png' }] }))
    expect(screen.getByAltText('Alt A')).toHaveAttribute('src', expect.stringContaining('a.png'))
    expect(document.querySelectorAll('article .entry-media img')).toHaveLength(3)
    expect(document.querySelector('img[src$="cover.png"]')).toBeNull()
    expect(document.querySelector('img[src$="b.png"]')).toHaveAttribute('alt', '')
    expect(document.querySelector('img[src$="c.png"]')).toHaveAttribute('alt', 'Title x')
  })

  it('falls back to image when media is empty', () => {
    show(entry('x', { image: 'cover.png', media: [] }))
    expect(screen.getByAltText('Title x')).toHaveAttribute('src', expect.stringContaining('cover.png'))
  })

  it('hides a broken image', () => {
    show(entry('x', { image: 'cover.png' }))
    const img = screen.getByAltText('Title x')
    fireEvent.error(img)
    expect(img.style.display).toBe('none')
  })

  it('shows Spanish content with fallback to English', async () => {
    localStorage.setItem('portfolio.lang', 'es')
    show(entry('x', { title: { en: 'Only EN' }, description: { en: 'EN one\n\nEN two', es: 'ES uno\n\nES dos' } }))
    expect(screen.getByRole('heading', { level: 1, name: 'Only EN' })).toBeInTheDocument()
    expect(screen.getByText('ES uno')).toBeInTheDocument()
    expect(screen.getByText('ES dos')).toBeInTheDocument()
  })

  it('renders skill chips that open the panel', async () => {
    show(entry('x', { languages: ['Go'], tools: ['go'] }))
    const chips = screen.getAllByRole('button', { name: 'Go' })
    expect(chips).toHaveLength(1)
    await userEvent.click(chips[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  describe('layout', () => {
    const q = (sel: string) => document.querySelector(sel)

    it('has a head with a title zone (h1, subtitle, dates) and a skills zone', () => {
      show(entry('x', { organization: 'Acme', role: { en: 'Dev' }, start: '2020-01', end: '2021-02', languages: ['Go'] }))
      const head = q('article.entry-detail > header.entry-detail-head')!
      expect(head).not.toBeNull()
      const title = head.querySelector(':scope > .entry-detail-title')!
      expect(title.querySelector('h1')).toHaveTextContent('Title x')
      expect(title.querySelector('p.entry-subtitle')).toHaveTextContent('Acme · Dev')
      expect(title.querySelector('p.entry-dates')).toHaveTextContent('2020-01 – 2021-02')
      expect(head.querySelector(':scope > .entry-detail-skills')).not.toBeNull()
    })

    it('orders head, links block, description, media', () => {
      show(entry('x', { image: 'c.png', links: [{ label: 'Repo', url: 'https://e.com' }] }))
      const kids = [...q('article.entry-detail')!.children].map((c) => c.className)
      expect(kids).toEqual(['entry-detail-head', 'entry-detail-links', 'entry-detail-description', 'entry-media'])
      const head = q('.entry-detail-head')!
      const links = q('.entry-detail-links')!
      const desc = q('.entry-detail-description')!
      const media = q('.entry-media')!
      const follows = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
      expect(follows(head, links)).toBe(true)
      expect(follows(links, desc)).toBe(true)
      expect(follows(desc, media)).toBe(true)
      expect(desc.querySelectorAll('p')).toHaveLength(1)
    })

    it('renders links as a list of external links in their own block', () => {
      show(entry('x', { links: [{ label: 'Repo', url: 'https://e.com' }, { label: 'Demo', url: 'https://d.com' }] }))
      const block = q('article > .entry-detail-links')!
      const items = [...block.querySelectorAll('li a')] as HTMLAnchorElement[]
      expect(items.map((a) => a.textContent)).toEqual(['Repo', 'Demo'])
      for (const a of items) {
        expect(a).toHaveAttribute('target', '_blank')
        expect(a).toHaveAttribute('rel', 'noopener noreferrer')
      }
      expect(items[0]).toHaveAttribute('href', 'https://e.com')
    })

    it('renders downloads as download links in their own block after the links', () => {
      show(
        entry('x', {
          links: [{ label: 'Repo', url: 'https://e.com' }],
          downloads: [{ label: { en: 'Thesis (PDF)' }, file: 'docs/thesis.pdf' }],
        }),
      )
      const kids = [...q('article')!.children].map((c) => c.className)
      expect(kids.indexOf('entry-detail-downloads')).toBe(kids.indexOf('entry-detail-links') + 1)
      const a = q('article > .entry-detail-downloads li a') as HTMLAnchorElement
      expect(a).toHaveTextContent('Thesis (PDF)')
      expect(a).toHaveAttribute('download')
      expect(a.getAttribute('href')).toMatch(/docs\/thesis\.pdf$/)
      expect(a).not.toHaveAttribute('target')
    })

    it('renders no downloads block without downloads', () => {
      show(entry('x'))
      expect(q('.entry-detail-downloads')).toBeNull()
    })

    it('renders no links block without links', () => {
      show(entry('x'))
      expect(q('.entry-detail-links')).toBeNull()
      cleanup()
      show(entry('x', { links: [] }))
      expect(q('.entry-detail-links')).toBeNull()
    })

    it('marks the gallery with the image count and never slices', () => {
      show(entry('x', { media: [{ src: 'a.png' }] }))
      expect(q('.entry-media')).toHaveAttribute('data-count', '1')
      cleanup()
      show(entry('x', { media: [{ src: 'a.png' }, { src: 'b.png' }] }))
      expect(q('.entry-media')).toHaveAttribute('data-count', 'many')
      cleanup()
      show(entry('x', { media: ['a', 'b', 'c', 'd', 'e'].map((n) => ({ src: `${n}.png` })) }))
      expect(q('.entry-media')).toHaveAttribute('data-count', 'many')
      expect(document.querySelectorAll('.entry-media img')).toHaveLength(5)
      cleanup()
      show(entry('x', { image: 'cover.png', media: [] }))
      expect(q('.entry-media')).toHaveAttribute('data-count', '1')
      expect(document.querySelectorAll('.entry-media img')).toHaveLength(1)
    })

    it('groups skills as languages, tools, frameworks with headings', () => {
      show(entry('x', { languages: ['Go'], tools: ['Git'], frameworks: ['React'] }))
      const groups = [...document.querySelectorAll('.entry-detail-skills .entry-skill-group')]
      expect(groups.map((g) => g.querySelector('h2')!.textContent)).toEqual(['Languages', 'Tools', 'Frameworks'])
      expect(within(groups[0] as HTMLElement).getByRole('button', { name: 'Go' })).toBeInTheDocument()
      expect(within(groups[1] as HTMLElement).getByRole('button', { name: 'Git' })).toBeInTheDocument()
      expect(within(groups[2] as HTMLElement).getByRole('button', { name: 'React' })).toBeInTheDocument()
    })

    it('omits groups with no skills entirely', () => {
      show(entry('x', { languages: ['Go'], tools: [], frameworks: [] }))
      expect(screen.queryByRole('heading', { level: 2, name: 'Tools' })).toBeNull()
      expect(screen.queryByRole('heading', { level: 2, name: 'Frameworks' })).toBeNull()
      expect(document.querySelectorAll('.entry-skill-group')).toHaveLength(1)
    })

    it('omits the skills zone when there are no skills', () => {
      show(entry('x'))
      expect(q('.entry-detail-skills')).toBeNull()
      expect(q('.entry-skill-group')).toBeNull()
      expect(q('.entry-detail-title h1')).not.toBeNull()
    })

    it('dedupes across arrays, the first array wins', () => {
      show(entry('x', { languages: ['Go'], tools: ['go', 'Git'], frameworks: ['GIT'] }))
      expect(screen.getAllByRole('button', { name: 'Go' })).toHaveLength(1)
      expect(screen.getAllByRole('button', { name: 'Git' })).toHaveLength(1)
      const groups = [...document.querySelectorAll('.entry-skill-group')]
      expect(groups.map((g) => g.querySelector('h2')!.textContent)).toEqual(['Languages', 'Tools'])
    })

    it('translates the group headings', () => {
      localStorage.setItem('portfolio.lang', 'es')
      show(entry('x', { languages: ['Go'], tools: ['Git'], frameworks: ['React'] }))
      expect([...document.querySelectorAll('.entry-skill-group h2')].map((h) => h.textContent)).toEqual([
        'Lenguajes',
        'Herramientas',
        'Frameworks',
      ])
    })
  })
})
