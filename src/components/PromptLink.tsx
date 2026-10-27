import { Link } from 'react-router-dom'

export function PromptLink({
  to,
  command,
  user,
  host,
}: {
  to: string
  command: string
  user: string
  host: string
}) {
  return (
    <Link className="prompt-link" to={to}>
      <span className="prompt-prefix">{`${user}@${host}:~$ `}</span>
      {command}
    </Link>
  )
}
