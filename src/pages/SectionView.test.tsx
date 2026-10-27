import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { sections, testAbout as about } from '../test-fixtures'
import { markPagesSeen, renderApp } from '../test-utils'
import { SectionView } from './SectionView'

beforeEach(() => {
  localStorage.clear()
  markPagesSeen('projects')
})

describe('SectionView', () => {
  it('shows every entry including unflagged ones, with the ls --all command', () => {
    const { container } = renderApp(<SectionView about={about} section={sections[0]} />, { pageId: 'projects' })
    expect(screen.getAllByText('ls projects --all').length).toBeGreaterThan(0)
    expect(container.querySelector('a[href="/projects/foo"]')).not.toBeNull()
    expect(container.querySelector('a[href="/projects/bar"]')).not.toBeNull()
    expect(container.querySelector('.entry-grid')).not.toBeNull()
  })

  it('has exactly one h1 (sr-only, the section title) and a plain h2', () => {
    const { container } = renderApp(<SectionView about={about} section={sections[0]} />, { pageId: 'projects' })
    const h1 = container.querySelectorAll('h1')
    expect(h1).toHaveLength(1)
    expect(h1[0]).toHaveClass('sr-only')
    expect(h1[0]).toHaveTextContent('Projects')
    expect(screen.getByRole('heading', { level: 2, name: 'Projects' }).querySelector('a')).toBeNull()
  })
})
