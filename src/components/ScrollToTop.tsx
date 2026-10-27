import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// scrollY left behind per location key (in memory; Back/Forward stay within the session)
const saved = new Map<string, number>()

/**
 * Scrolls to the top on a new navigation (PUSH/REPLACE, including a click on a link to the
 * current path, which gets a new key); on Back/Forward (POP) it restores where the visitor was.
 */
export function ScrollToTop() {
  const { key } = useLocation()
  const type = useNavigationType()

  useLayoutEffect(() => {
    window.scrollTo?.(0, type === 'POP' ? (saved.get(key) ?? 0) : 0)
    // layout cleanups run before the next page's layout effects, so scrollY is still the old page's
    return () => void saved.set(key, window.scrollY)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps -- `type` only matters when the key changes
  return null
}
