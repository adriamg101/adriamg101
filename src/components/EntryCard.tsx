import { Link } from 'react-router-dom'
import { resolveAsset } from '../lib/assets'
import { entrySubtitle, entrySummary } from '../lib/entry'
import { pickText } from '../lib/i18n'
import type { Entry } from '../lib/schema'
import { formatDateRange } from '../lib/format'
import { useSettings, useT } from '../lib/settings'
import { SkillChips } from './SkillChips'

export function EntryCard({
  entry,
  sectionKey,
}: {
  entry: Entry
  sectionKey: string
}) {
  const { lang } = useSettings()
  const t = useT()
  const title = pickText(entry.title, lang)
  const subtitle = entrySubtitle(entry, lang)
  const dates = formatDateRange(entry.start, entry.end, t('date.present'))

  return (
    <article className="entry-card" data-section={sectionKey}>
      <h3>
        <Link className="entry-card-link" to={`/${sectionKey}/${entry.id}`}>
          {title}
        </Link>
      </h3>
      {subtitle && <p className="entry-subtitle">{subtitle}</p>}
      {dates && <p className="entry-dates">{dates}</p>}
      {entry.image && (
        <img
          className="entry-cover"
          src={resolveAsset(entry.image)}
          alt={title}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      {/* a fallback (first paragraph of the description) is clamped to two lines by CSS */}
      <p className="entry-summary" data-fallback={entry.summary ? undefined : 'true'}>
        {entrySummary(entry, lang)}
      </p>
      <SkillChips entry={entry} />
    </article>
  )
}
