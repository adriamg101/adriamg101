import { EntryCard } from '../components/EntryCard'
import { SectionHeading } from '../components/SectionHeading'
import { Sequence } from '../components/Sequence'
import { useT } from '../lib/settings'
import type { About, Section } from '../lib/schema'

export function SectionView({ about, section }: { about: About; section: Section }) {
  const t = useT()
  const { user, host } = about.prompt
  const content = (
    <>
      <h1 className="sr-only">{t(section.titleKey)}</h1>
      <SectionHeading>{t(section.titleKey)}</SectionHeading>
      <div className="entry-grid">
        {section.entries.map((e) => (
          <EntryCard key={e.id} entry={e} sectionKey={section.key} />
        ))}
      </div>
    </>
  )
  return (
    <Sequence
      steps={[{ id: section.key, command: `ls ${section.key} --all`, content }]}
      user={user}
      host={host}
    />
  )
}
