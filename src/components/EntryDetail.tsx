import { resolveAsset } from '../lib/assets'
import { descriptionParagraphs, entrySubtitle } from '../lib/entry'
import { formatDateRange } from '../lib/format'
import { pickText } from '../lib/i18n'
import type { Entry } from '../lib/schema'
import { useSettings, useT } from '../lib/settings'
import { SkillGroups } from './SkillChips'

export function EntryDetail({ entry, sectionKey }: { entry: Entry; sectionKey: string }) {
  const { lang } = useSettings()
  const t = useT()
  const title = pickText(entry.title, lang)
  const subtitle = entrySubtitle(entry, lang)
  const dates = formatDateRange(entry.start, entry.end, t('date.present'))
  const images =
    entry.media && entry.media.length > 0
      ? entry.media.map((m) => ({ src: m.src, alt: m.alt === undefined ? title : pickText(m.alt, lang) }))
      : entry.image
        ? [{ src: entry.image, alt: title }]
        : []

  return (
    <article className="entry-detail" data-section={sectionKey}>
      <header className="entry-detail-head">
        <div className="entry-detail-title">
          <h1>{title}</h1>
          {subtitle && <p className="entry-subtitle">{subtitle}</p>}
          {dates && <p className="entry-dates">{dates}</p>}
        </div>
        <SkillGroups entry={entry} />
      </header>
      {entry.links && entry.links.length > 0 && (
        <ul className="entry-detail-links">
          {entry.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      {entry.downloads && entry.downloads.length > 0 && (
        <ul className="entry-detail-downloads">
          {entry.downloads.map((d) => (
            <li key={d.file}>
              <a href={resolveAsset(d.file)} download rel="noopener noreferrer">
                {pickText(d.label, lang)}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="entry-detail-description">
        {descriptionParagraphs(pickText(entry.description, lang)).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {images.length > 0 && (
        <div className="entry-media" data-count={images.length === 1 ? 1 : 'many'}>
          {images.map((img) => (
            <img
              key={img.src}
              src={resolveAsset(img.src)}
              alt={img.alt}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ))}
        </div>
      )}
    </article>
  )
}
