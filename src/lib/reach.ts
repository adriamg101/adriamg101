import { useEffect, useState, type RefObject } from 'react'

/** A prompt counts as reached when its top is this far above the bottom edge of the viewport. */
export const REACH_OFFSET_PX = 200

export function hasReached(top: number, innerHeight: number, atBottom: boolean, offset: number = REACH_OFFSET_PX): boolean {
  // fallback so nothing can deadlock: at the very bottom of the page, being on screen is enough
  return top <= innerHeight - offset || (atBottom && top <= innerHeight)
}

function scrolledToBottom(): boolean {
  return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1
}

/**
 * Latch: false until the element is reached (see `hasReached`), then true for good.
 * Checked on mount, scroll, resize and body layout changes. Always true when not `enabled`.
 */
export function useReached(ref: RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [reached, setReached] = useState(false)

  useEffect(() => {
    if (!enabled || reached) return
    const check = () => {
      const el = ref.current
      if (el && hasReached(el.getBoundingClientRect().top, window.innerHeight, scrolledToBottom())) setReached(true)
    }
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(check) : null
    observer?.observe(document.body)
    check()
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      observer?.disconnect()
    }
  }, [enabled, reached, ref])

  return !enabled || reached
}
