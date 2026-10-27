import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LEAD_MS, PAUSE_MS, charDelay } from '../lib/typing'
import { useAnimation } from './AnimationProvider'

type Props = {
  id: string
  command: string
  user: string
  host: string
  /** Typing may begin once this is true and LEAD_MS have passed since mount. */
  start?: boolean
  /** Called exactly once, when the output is revealed after typing (never when animation is off). */
  onFinished?: (id: string) => void
  children: ReactNode
}

export function Prompt({ id, command, user, host, start = true, onFinished, children }: Props) {
  const { animate } = useAnimation()
  const [leadDone, setLeadDone] = useState(false)
  const [typing, setTyping] = useState(false)
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const countRef = useRef(0)
  const finishedRef = useRef(false)
  const onFinishedRef = useRef(onFinished)
  useEffect(() => {
    onFinishedRef.current = onFinished
  })

  // The cursor blinks for LEAD_MS after the prompt line appears.
  useEffect(() => {
    if (!animate) return
    const timer = setTimeout(() => setLeadDone(true), LEAD_MS)
    return () => clearTimeout(timer)
  }, [animate])

  // Once started, typing never stops (a latch), whatever `start` does next.
  useEffect(() => {
    if (animate && start && leadDone) setTyping(true)
  }, [animate, start, leadDone])

  // A single timeout chain; it resumes from the current count if the effect re-runs (StrictMode).
  useEffect(() => {
    if (!animate || !typing || finishedRef.current) return
    let timer: ReturnType<typeof setTimeout>
    const step = () => {
      if (countRef.current >= command.length) {
        timer = setTimeout(() => {
          if (finishedRef.current) return
          finishedRef.current = true
          setDone(true)
          onFinishedRef.current?.(id)
        }, PAUSE_MS)
        return
      }
      timer = setTimeout(() => {
        countRef.current += 1
        setCount(countRef.current)
        step()
      }, charDelay())
    }
    step()
    return () => clearTimeout(timer)
  }, [animate, typing, command, id])

  const text = animate ? command.slice(0, count) : command
  const revealed = !animate || done

  return (
    <div id={`block-${id}`} className="prompt-block">
      <div className="prompt-line">
        <span aria-hidden="true">
          <span className="prompt-prefix">{`${user}@${host}:~$ `}</span>
          {text}
          {!revealed && <span className="prompt-cursor" data-state={typing ? 'typing' : 'idle'} />}
        </span>
        <span className="sr-only">{command}</span>
      </div>
      <div
        className="prompt-output"
        data-revealed={revealed ? 'true' : 'false'}
        // only a block revealed by finishing its own typing plays the reveal animation
        data-animated={animate && done ? 'true' : undefined}
        // hidden by opacity until revealed: keep it out of focus, find-in-page and screen readers
        inert={revealed ? undefined : true}
      >
        {children}
      </div>
    </div>
  )
}
