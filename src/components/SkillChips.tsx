import type { Entry } from '../lib/schema'
import { normalizeSkillKey } from '../lib/skills'
import { useT } from '../lib/settings'
import { useSkillPanel } from './SkillPanel'

export function SkillChips({ entry }: { entry: Entry }) {
  const { openSkill, nameOf } = useSkillPanel()
  const seen = new Set<string>()
  const tags: { key: string; label: string }[] = []
  for (const raw of [...entry.languages, ...entry.tools, ...entry.frameworks]) {
    const key = normalizeSkillKey(raw)
    if (!key || seen.has(key)) continue
    seen.add(key)
    tags.push({ key, label: nameOf(key) ?? raw })
  }
  if (tags.length === 0) return null
  return (
    <div className="entry-tags">
      {tags.map(({ key, label }) => (
        <button key={key} type="button" onClick={() => openSkill(key)}>
          {label}
        </button>
      ))}
    </div>
  )
}

const GROUPS = [
  ['languages', 'skills.languages'],
  ['tools', 'skills.tools'],
  ['frameworks', 'skills.frameworks'],
] as const

/** The entry's skills grouped by category (languages, tools, frameworks); a skill
 *  listed in several arrays shows once, in the first group. Renders nothing when empty. */
export function SkillGroups({ entry }: { entry: Entry }) {
  const { openSkill, nameOf } = useSkillPanel()
  const t = useT()
  const seen = new Set<string>()
  const groups = GROUPS.map(([field, titleKey]) => {
    const tags: { key: string; label: string }[] = []
    for (const raw of entry[field]) {
      const key = normalizeSkillKey(raw)
      if (!key || seen.has(key)) continue
      seen.add(key)
      tags.push({ key, label: nameOf(key) ?? raw })
    }
    return { field, title: t(titleKey), tags }
  }).filter((g) => g.tags.length > 0)
  if (groups.length === 0) return null
  return (
    <div className="entry-detail-skills">
      {groups.map((g) => (
        <div className="entry-skill-group" key={g.field}>
          <h2>{g.title}</h2>
          <div className="entry-tags">
            {g.tags.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => openSkill(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
