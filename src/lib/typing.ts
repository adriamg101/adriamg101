export const LEAD_MS = 700
export const PAUSE_MS = 250
export const GAP_MS = 300

export function charDelay(random: () => number = Math.random): number {
  return 30 + Math.round(random() * 30)
}
