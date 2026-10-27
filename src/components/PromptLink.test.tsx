import { screen } from '@testing-library/react'
import { renderApp } from '../test-utils'
import { PromptLink } from './PromptLink'

describe('PromptLink', () => {
  it('renders the prompt prefix and command as a link', () => {
    renderApp(<PromptLink to="/projects" command="ls projects" user="adria" host="portfolio" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/projects')
    expect(link).toHaveClass('prompt-link')
    expect(link).toHaveTextContent('adria@portfolio:~$ ls projects')
    expect(link.querySelector('.prompt-prefix')).toHaveTextContent('adria@portfolio:~$')
  })
})
