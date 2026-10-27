import { screen } from '@testing-library/react'
import { renderApp } from '../test-utils'
import { SectionHeading } from './SectionHeading'

describe('SectionHeading', () => {
  it('renders plain text without `to`', () => {
    renderApp(<SectionHeading>Projects</SectionHeading>)
    expect(screen.getByRole('heading', { level: 2, name: 'Projects' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders a link inside the heading with `to`', () => {
    renderApp(<SectionHeading to="/projects">Projects</SectionHeading>)
    const link = screen.getByRole('link', { name: 'Projects' })
    expect(link).toHaveAttribute('href', '/projects')
    expect(screen.getByRole('heading', { level: 2 })).toContainElement(link)
  })

  it('renders a non-heading element with asHeading={false}, keeping class and link', () => {
    renderApp(<SectionHeading asHeading={false} to="/projects">Projects</SectionHeading>)
    expect(screen.queryByRole('heading')).toBeNull()
    const link = screen.getByRole('link', { name: 'Projects' })
    expect(link.parentElement).toHaveClass('section-heading')
  })
})
