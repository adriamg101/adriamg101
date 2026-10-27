import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { entry, sections, testAbout as about } from '../test-fixtures'
import { markPagesSeen, renderApp } from '../test-utils'
import { DetailView } from './DetailView'

beforeEach(() => {
  localStorage.clear()
  markPagesSeen('projects/foo')
})

describe('DetailView', () => {
  it('uses cat <section>/<slug>, links the heading back and has a single h1', () => {
    const e = entry('foo', { title: { en: 'My Cool App' } })
    const { container } = renderApp(<DetailView about={about} section={sections[0]} entry={e} />, {
      pageId: 'projects/foo',
    })
    expect(screen.getAllByText('cat projects/my-cool-app').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects')
    expect(screen.queryByRole('heading', { name: 'Projects' })).toBeNull()
    const h1 = container.querySelectorAll('h1')
    expect(h1).toHaveLength(1)
    expect(container.querySelectorAll('h2')).toHaveLength(0)
    expect(h1[0]).toHaveTextContent('My Cool App')
  })
})
