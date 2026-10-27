import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SkillIcon } from './SkillIcon'

describe('SkillIcon', () => {
  beforeEach(() => vi.stubEnv('BASE_URL', '/adriamg101/'))
  afterEach(() => vi.unstubAllEnvs())
  it('renders an svg for a mapped skill', () => {
    const { container } = render(<SkillIcon skill={{ key: 'react', name: 'React', category: 'frameworks' }} />)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.getByLabelText('React')).toBeTruthy()
  })
  it('prefers a custom icon url even if mapped', () => {
    const { container } = render(
      <SkillIcon skill={{ key: 'react', name: 'React', category: 'frameworks', icon: '/x.svg' }} />,
    )
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/adriamg101/x.svg')
    expect(container.querySelector('svg')).toBeNull()
  })
  it('falls back to text for unmapped skills', () => {
    const { container } = render(<SkillIcon skill={{ key: 'foobar', name: 'FooBar', category: 'tools' }} />)
    expect(screen.getByText('FooBar')).toBeTruthy()
    expect(container.querySelector('svg')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })
  it('renders C# as text since no logo is mapped', () => {
    const { container } = render(<SkillIcon skill={{ key: 'c#', name: 'C#', category: 'languages' }} />)
    expect(screen.getByText('C#')).toBeTruthy()
    expect(container.querySelector('svg')).toBeNull()
  })
  it('resolves a custom icon path against the base', () => {
    const { container } = render(
      <SkillIcon skill={{ key: 'c#', name: 'C#', category: 'languages', icon: 'icons/csharp.svg' }} />,
    )
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/adriamg101/icons/csharp.svg')
    expect(container.querySelector('img')).toHaveAttribute('alt', 'C#')
  })
  it('hides its label when showLabel is false (mapped, custom and unmapped)', () => {
    const { container, rerender } = render(
      <SkillIcon showLabel={false} skill={{ key: 'react', name: 'React', category: 'frameworks' }} />,
    )
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByLabelText('React')).toBeNull()
    rerender(<SkillIcon showLabel={false} skill={{ key: 'c#', name: 'C#', category: 'languages', icon: '/a.svg' }} />)
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(container.querySelector('img')).toHaveAttribute('aria-hidden', 'true')
    rerender(<SkillIcon showLabel={false} skill={{ key: 'foobar', name: 'FooBar', category: 'tools' }} />)
    expect(container).toBeEmptyDOMElement()
  })
})
