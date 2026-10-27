import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** `asHeading={false}` keeps the look and the link but renders a <div> (no heading in the outline). */
export function SectionHeading({
  children,
  to,
  asHeading = true,
}: {
  children: ReactNode
  to?: string
  asHeading?: boolean
}) {
  const Tag = asHeading ? 'h2' : 'div'
  return <Tag className="section-heading">{to ? <Link to={to}>{children}</Link> : children}</Tag>
}
