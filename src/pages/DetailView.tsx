import { EntryDetail } from '../components/EntryDetail'
import { SectionHeading } from '../components/SectionHeading'
import { Sequence } from '../components/Sequence'
import { entryFileName } from '../lib/entry'
import { useT } from '../lib/settings'
import type { About, Entry, Section } from '../lib/schema'

export function DetailView({ about, section, entry }: { about: About; section: Section; entry: Entry }) {
  const t = useT()
  const { user, host } = about.prompt
  const content = (
    <>
      <SectionHeading asHeading={false} to={`/${section.key}`}>{t(section.titleKey)}</SectionHeading>
      <EntryDetail entry={entry} sectionKey={section.key} />
    </>
  )
  return (
    <Sequence
      steps={[{ id: `${section.key}/${entry.id}`, command: `cat ${section.key}/${entryFileName(entry)}`, content }]}
      user={user}
      host={host}
    />
  )
}
