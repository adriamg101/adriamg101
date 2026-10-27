import { EntryCard } from '../components/EntryCard'
import { NeofetchCard } from '../components/NeofetchCard'
import { PromptLink } from '../components/PromptLink'
import { SectionHeading } from '../components/SectionHeading'
import { Sequence, type SequenceStepData } from '../components/Sequence'
import { useSkillPanel } from '../components/SkillPanel'
import { SkillsMarquee } from '../components/SkillsMarquee'
import { pickText } from '../lib/i18n'
import { useSettings, useT } from '../lib/settings'
import type { About, Section } from '../lib/schema'
import { homeEntries, type Skill } from '../lib/skills'

export function HomePage({ about, skills, sections }: { about: About; skills: Skill[]; sections: Section[] }) {
  const { openSkill } = useSkillPanel()
  const t = useT()
  const { lang } = useSettings()
  const { user, host } = about.prompt
  const steps: SequenceStepData[] = [{ id: 'neofetch', command: 'neofetch', content: <NeofetchCard about={about} /> }]
  steps.push({
    id: 'bio',
    command: 'cat bio.txt',
    content: <p className="neofetch-bio">{pickText(about.bio, lang)}</p>,
  })
  if (skills.length > 0) {
    steps.push({
      id: 'skills',
      command: 'show skills --carousel',
      content: (
        <>
          <SectionHeading to="/skills">{t('home.skills')}</SectionHeading>
          <SkillsMarquee skills={skills} onSelect={openSkill} />
          <PromptLink to="/skills" command="show skills --all" user={user} host={host} />
        </>
      ),
    })
  }
  for (const { section, entries } of homeEntries(sections)) {
    steps.push({
      id: section.key,
      command: `ls ${section.key}`,
      content: (
        <>
          <SectionHeading to={`/${section.key}`}>{t(section.titleKey)}</SectionHeading>
          <div className="entry-grid">
            {entries.map((e) => (
              <EntryCard key={e.id} entry={e} sectionKey={section.key} />
            ))}
          </div>
          <PromptLink to={`/${section.key}`} command={`ls ${section.key} --all`} user={user} host={host} />
        </>
      ),
    })
  }
  return <Sequence steps={steps} user={user} host={host} scrollGated />
}
