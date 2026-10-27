import { useEffect, useRef, useState } from 'react'
import type { FocusEvent as ReactFocusEvent, PointerEvent as ReactPointerEvent } from 'react'
import { copiesNeeded, isDrag, wrapOffset } from '../lib/marquee'
import type { Skill } from '../lib/skills'
import { SkillIcon } from './SkillIcon'

const SPEED = 40 // px per second, leftward
const MAX_DT = 100 // ms; avoids a jump after a background tab resumes

type Drag = { pointerId: number; startX: number; startOffset: number; active: boolean }

export function SkillsMarquee({
  skills,
  onSelect,
}: {
  skills: Skill[]
  onSelect: (key: string) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const setRef = useRef<HTMLDivElement>(null)
  const offset = useRef(0)
  const loopWidth = useRef(0)
  const hovering = useRef(false)
  const focused = useRef(false)
  const drag = useRef<Drag | null>(null)
  const suppressClick = useRef(false)
  const [copies, setCopies] = useState(() => copiesNeeded(0, 0))
  const hasSkills = skills.length > 0
  const reducedMotion = useRef(false)

  useEffect(() => {
    const viewport = viewportRef.current
    const set = setRef.current
    if (!hasSkills || !viewport || !set) return
    const measure = () => {
      loopWidth.current = set.offsetWidth
      setCopies(copiesNeeded(set.offsetWidth, viewport.offsetWidth))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(viewport)
    ro.observe(set)
    return () => ro.disconnect()
  }, [hasSkills, skills])

  useEffect(() => {
    if (!hasSkills || typeof requestAnimationFrame === 'undefined') return
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    reducedMotion.current = mq?.matches ?? false
    const onMq = (e: MediaQueryListEvent) => (reducedMotion.current = e.matches)
    mq?.addEventListener?.('change', onMq)
    let frame = 0
    let last: number | null = null
    const apply = () => {
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${offset.current}px,0,0)`
    }
    const tick = (now: number) => {
      const dt = last === null ? 0 : Math.min(now - last, MAX_DT)
      last = now
      if (!reducedMotion.current && !hovering.current && !focused.current && !drag.current?.active) {
        offset.current = wrapOffset(offset.current - (SPEED * dt) / 1000, loopWidth.current)
        apply()
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      mq?.removeEventListener?.('change', onMq)
    }
  }, [hasSkills])

  if (!hasSkills) return null

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    suppressClick.current = false
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startOffset: offset.current, active: false }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    const dx = e.clientX - d.startX
    if (!d.active) {
      if (!isDrag(dx)) return
      d.active = true
      suppressClick.current = true
      // Capture only once it is a real drag so plain clicks still reach the buttons.
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    offset.current = wrapOffset(d.startOffset + dx, loopWidth.current)
    if (trackRef.current) trackRef.current.style.transform = `translate3d(${offset.current}px,0,0)`
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    drag.current = null
    if (d.active && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const onFocus = (e: ReactFocusEvent<HTMLDivElement>) => {
    focused.current = true
    const viewport = e.currentTarget
    // Keep the focused button visible by moving the track, never the native scroll position.
    const b = e.target.getBoundingClientRect()
    const v = viewport.getBoundingClientRect()
    let delta = 0
    if (b.left < v.left) delta = v.left - b.left
    else if (b.right > v.right) delta = v.right - b.right
    if (delta !== 0) {
      offset.current = wrapOffset(offset.current + delta, loopWidth.current)
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${offset.current}px,0,0)`
    }
    if (viewport.scrollLeft !== 0) viewport.scrollLeft = 0
  }

  const onBlur = (e: ReactFocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focused.current = false
  }

  return (
    <div
      ref={viewportRef}
      className="marquee"
      style={{ overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none' }}
      onFocus={onFocus}
      onBlur={onBlur}
      onScroll={(e) => {
        if (e.currentTarget.scrollLeft !== 0) e.currentTarget.scrollLeft = 0
      }}
      onPointerEnter={() => (hovering.current = true)}
      onPointerLeave={() => (hovering.current = false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false
          e.stopPropagation()
          e.preventDefault()
        }
      }}
    >
      <div ref={trackRef} className="marquee-track" style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}>
        {Array.from({ length: copies }, (_, i) => (
          <div
            key={i}
            ref={i === 0 ? setRef : undefined}
            className="marquee-set"
            style={{ display: 'flex', flexShrink: 0 }}
            aria-hidden={i > 0 ? true : undefined}
          >
            {skills.map((skill) => (
              <button
                key={skill.key}
                type="button"
                className="marquee-item"
                tabIndex={i > 0 ? -1 : undefined}
                onClick={() => onSelect(skill.key)}
              >
                <SkillIcon skill={skill} showLabel={false} />
                <span>{skill.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
