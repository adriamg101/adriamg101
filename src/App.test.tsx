import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Section } from './lib/schema'
import { readRecord } from './lib/visit'
import { entry, testAbout } from './test-fixtures'
import { markPagesSeen } from './test-utils'

const mocked = vi.hoisted(() => ({ content: {} as { about: unknown; sections: Section[]; skillOverrides: object } }))
vi.mock('./lib/content', () => ({ content: mocked.content }))

import App from './App'

const baseSections = (): Section[] => [
  {
    key: 'projects',
    titleKey: 'section.projects',
    entries: [entry('foo', { home: true, languages: ['Python'] }), entry('bar', { title: { en: 'Bar Thing' } })],
  },
  { key: 'experience', titleKey: 'section.experience', entries: [] },
]

beforeEach(() => {
  localStorage.clear()
  mocked.content.about = testAbout
  mocked.content.sections = baseSections()
  mocked.content.skillOverrides = {}
  markPagesSeen('home', 'skills', 'projects', 'detail')
})
afterEach(() => {
  window.location.hash = ''
})

const go = (hash: string) => {
  window.location.hash = hash
  return render(<App />)
}
const here = () => window.location.hash
const h1s = () => [...document.querySelectorAll('h1')]

describe('App', () => {
  it('renders a main landmark', () => {
    go('#/')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
  })

  it('renders Home at / with its single h1', () => {
    go('#/')
    expect(document.querySelector('#block-neofetch')).not.toBeNull()
    expect(h1s()).toHaveLength(1)
  })

  it('renders the skills view at /skills with one h1', () => {
    go('#/skills')
    expect(screen.getAllByText('show skills --all').length).toBeGreaterThan(0)
    expect(h1s()).toHaveLength(1)
  })

  it('renders the section view at /projects, showing unflagged entries', () => {
    go('#/projects')
    expect(screen.getAllByText('ls projects --all').length).toBeGreaterThan(0)
    expect(document.querySelector('main a[href="#/projects/bar"]')).not.toBeNull()
    expect(h1s()).toHaveLength(1)
  })

  it('renders the detail view at /projects/<id>, including unflagged entries', () => {
    go('#/projects/bar')
    expect(screen.getAllByText('cat projects/bar-thing').length).toBeGreaterThan(0)
    expect(h1s()).toHaveLength(1)
    expect(h1s()[0]).toHaveTextContent('Bar Thing')
  })

  it('redirects an unknown entry to the section view', () => {
    go('#/projects/does-not-exist')
    expect(screen.getAllByText('ls projects --all').length).toBeGreaterThan(0)
    expect(here()).toBe('#/projects')
  })

  it.each(['#/nope', '#/nope/x', '#/experience', '#/experience/x', '#/a/b/c'])('redirects %s to Home', (hash) => {
    go(hash)
    expect(document.querySelector('#block-neofetch')).not.toBeNull()
    expect(here()).toBe('#/')
  })

  it('redirects /skills to Home when there are no skills', () => {
    mocked.content.sections = [{ key: 'projects', titleKey: 'section.projects', entries: [entry('foo', { home: true })] }]
    go('#/skills')
    expect(document.querySelector('#block-neofetch')).not.toBeNull()
    expect(here()).toBe('#/')
  })

  it('remounts on page change so animation flags are independent', async () => {
    localStorage.clear()
    go('#/')
    expect(readRecord()!.seen).toEqual(['home'])
    const { default: userEvent } = await import('@testing-library/user-event')
    await userEvent.click(screen.getByRole('link', { name: 'Projects' }))
    expect(here()).toBe('#/projects')
    expect(readRecord()!.seen).toEqual(['home', 'projects'])
    expect(document.querySelector('#block-projects .prompt-cursor')).not.toBeNull()
  })

  // the `key` on AnimationProvider makes same-element-type route changes remount it
  it('animates the second page on its first visit: /projects -> /experience', async () => {
    mocked.content.sections = [
      baseSections()[0],
      { key: 'experience', titleKey: 'section.experience', entries: [entry('job')] },
    ]
    localStorage.clear()
    go('#/projects')
    const { default: userEvent } = await import('@testing-library/user-event')
    await userEvent.click(screen.getByRole('link', { name: 'Experience' }))
    expect(here()).toBe('#/experience')
    expect(readRecord()!.seen).toEqual(['projects', 'experience'])
    expect(document.querySelector('#block-experience .prompt-cursor')).not.toBeNull()
  })

  describe('detail views share one animation flag', () => {
    const block = (id: string) => document.querySelector(`#block-${id.replace('/', '\\/')}`)!
    const goTo = (hash: string) => act(() => void (window.location.hash = hash))

    it('animates the first detail view and records `detail`', () => {
      localStorage.clear()
      go('#/projects/foo')
      expect(readRecord()!.seen).toEqual(['detail'])
      expect(block('projects/foo').querySelector('.prompt-cursor')).toHaveAttribute('data-state', 'idle')
      expect(block('projects/foo').querySelector('.prompt-output')).toHaveAttribute('data-revealed', 'false')
    })

    it('does not animate another entry of the same section, nor re-record', async () => {
      localStorage.clear()
      go('#/projects/foo')
      goTo('#/projects/bar')
      await waitFor(() => expect(screen.getAllByText('cat projects/bar-thing').length).toBeGreaterThan(0))
      expect(readRecord()!.seen).toEqual(['detail'])
      expect(block('projects/bar').querySelector('.prompt-cursor')).toBeNull()
      expect(block('projects/bar').querySelector('.prompt-output')).toHaveAttribute('data-revealed', 'true')
    })

    it('does not animate an entry of another section', async () => {
      mocked.content.sections = [
        baseSections()[0],
        { key: 'experience', titleKey: 'section.experience', entries: [entry('job')] },
      ]
      localStorage.clear()
      go('#/projects/foo')
      goTo('#/experience/job')
      await waitFor(() => expect(screen.getAllByText('cat experience/title-job').length).toBeGreaterThan(0))
      expect(readRecord()!.seen).toEqual(['detail'])
      expect(block('experience/job').querySelector('.prompt-cursor')).toBeNull()
    })
  })
})
