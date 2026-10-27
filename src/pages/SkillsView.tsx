import { SectionHeading } from '../components/SectionHeading'
import { Sequence } from '../components/Sequence'
import { SkillIcon } from '../components/SkillIcon'
import { useSkillPanel } from '../components/SkillPanel'
import { useT } from '../lib/settings'
import type { About } from '../lib/schema'
import { groupSkills, type Skill } from '../lib/skills'

export function SkillsView({ about, skills }: { about: About; skills: Skill[] }) {
  const { openSkill } = useSkillPanel()
  const t = useT()
  const { user, host } = about.prompt
  const content = (
    <>
      <h1 className="sr-only">{t('home.skills')}</h1>
      <SectionHeading>{t('home.skills')}</SectionHeading>
      {groupSkills(skills).map((g) => (
        <section key={g.category} className="skill-group">
          <h3>{t(`skills.${g.category}` as const)}</h3>
          <div className="skill-chip-list">
            {g.skills.map((s) => (
              <button key={s.key} type="button" className="skill-chip" onClick={() => openSkill(s.key)}>
                <SkillIcon skill={s} showLabel={false} />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  )
  return <Sequence steps={[{ id: 'skills-all', command: 'show skills --all', content }]} user={user} host={host} />
}
