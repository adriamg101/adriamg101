export const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
export const ANIMATION_KEY = 'portfolio.animation'

export type AnimationRecord = { startedAt: number; seen: string[] }

export function readRecord(): AnimationRecord | null {
  try {
    const raw = localStorage.getItem(ANIMATION_KEY)
    if (raw === null) return null
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return null
    const { startedAt, seen } = data as { startedAt?: unknown; seen?: unknown }
    if (typeof startedAt !== 'number' || !Number.isFinite(startedAt) || startedAt < 0) return null
    if (!Array.isArray(seen) || !seen.every((s) => typeof s === 'string')) return null
    return { startedAt, seen: seen as string[] }
  } catch {
    return null
  }
}

export function writeRecord(record: AnimationRecord): void {
  try {
    localStorage.setItem(ANIMATION_KEY, JSON.stringify(record))
  } catch {
    // storage unavailable: animation state is not remembered
  }
}

export function enterPage(
  record: AnimationRecord | null,
  pageId: string,
  now: number,
  reducedMotion: boolean,
): { animate: boolean; record: AnimationRecord | null } {
  if (reducedMotion) return { animate: false, record: null }
  const expired = record === null || now < record.startedAt || now - record.startedAt >= RETURN_WINDOW_MS
  const base: AnimationRecord = expired ? { startedAt: now, seen: [] } : record
  const animate = !base.seen.includes(pageId)
  return { animate, record: { startedAt: base.startedAt, seen: [...new Set([...base.seen, pageId])] } }
}
