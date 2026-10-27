import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { enterPage, readRecord, writeRecord } from '../lib/visit'

type Animation = { animate: boolean }

function prefersReducedMotion(): boolean {
  if (typeof matchMedia !== 'function') return false
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

const AnimationContext = createContext<Animation | null>(null)

/** Per-page animation switch: one snapshot of the stored record when the page is entered. */
export function AnimationProvider({ pageId, children }: { pageId: string; children: ReactNode }) {
  // Pure initializer (no storage write) so StrictMode's double call cannot flip `animate`.
  const [entry] = useState(() => enterPage(readRecord(), pageId, Date.now(), prefersReducedMotion()))

  useEffect(() => {
    // idempotent, so StrictMode's effect re-run is harmless
    if (entry.record) writeRecord(entry.record)
  }, [entry])

  const value = useMemo(() => ({ animate: entry.animate }), [entry.animate])
  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>
}

export function useAnimation(): Animation {
  const ctx = useContext(AnimationContext)
  if (!ctx) throw new Error('useAnimation must be used inside AnimationProvider')
  return ctx
}
