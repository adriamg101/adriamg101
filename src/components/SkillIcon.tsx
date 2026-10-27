import { resolveAsset } from '../lib/assets'
import { iconMap } from '../lib/iconMap'
import type { Skill } from '../lib/skills'

// With showLabel=false the icon is decorative (the caller renders the name itself),
// and a skill without an icon renders nothing, so the name appears exactly once.
export function SkillIcon({ skill, size = 20, showLabel = true }: { skill: Skill; size?: number; showLabel?: boolean }) {
  if (skill.icon) {
    return (
      <img
        src={resolveAsset(skill.icon)}
        alt={showLabel ? skill.name : ''}
        aria-hidden={showLabel ? undefined : true}
        width={size}
        height={size}
      />
    )
  }
  const Icon = iconMap[skill.key]
  if (Icon) {
    return showLabel ? (
      <Icon size={size} aria-label={skill.name} role="img" />
    ) : (
      <Icon size={size} aria-hidden="true" />
    )
  }
  return showLabel ? <span>{skill.name}</span> : null
}
