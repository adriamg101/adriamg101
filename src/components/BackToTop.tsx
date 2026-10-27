import { useEffect, useState } from 'react'
import { useT } from '../lib/settings'
import { shouldShowBackToTop } from '../lib/scroll'

function prefersReducedMotion(): boolean {
  if (typeof matchMedia !== 'function') return false
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

function measure(): boolean {
  return shouldShowBackToTop(window.scrollY, document.documentElement.scrollHeight, window.innerHeight)
}

export function BackToTop() {
  const t = useT()
  const [visible, setVisible] = useState(measure)

  useEffect(() => {
    const update = () => setVisible(measure())
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    observer?.observe(document.body)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer?.disconnect()
    }
  }, [])

  if (!visible) return null
  return (
    <button
      type="button"
      className="back-to-top"
      aria-label={t('nav.top')}
      onClick={() => window.scrollTo?.({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
