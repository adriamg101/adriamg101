export function formatDateRange(start: string | undefined, end: string | undefined, presentLabel: string): string | undefined {
  if (!start) return undefined
  if (!end || end === start) return start
  return `${start} – ${end === 'present' ? presentLabel : end}`
}
