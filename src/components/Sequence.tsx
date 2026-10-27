import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useReached } from '../lib/reach'
import { GAP_MS } from '../lib/typing'
import { useAnimation } from './AnimationProvider'
import { Prompt } from './Prompt'

export type SequenceStepData = { id: string; command: string; content: ReactNode }

type Props = { steps: SequenceStepData[]; user: string; host: string; scrollGated?: boolean }

/**
 * Prompts that run one after another, like a terminal session: a step is rendered only when the
 * previous one has finished (plus GAP_MS). When `scrollGated`, every step after the first waits
 * to be reached before typing. Never scrolls the page.
 */
export function Sequence({ steps, user, host, scrollGated = false }: Props) {
  const { animate } = useAnimation()
  const [shown, setShown] = useState(1)
  const [finished, setFinished] = useState(0)

  const onFinished = useCallback((index: number) => setFinished((n) => Math.max(n, index + 1)), [])

  // Every rendered step has finished: the next one gets its turn after GAP_MS.
  useEffect(() => {
    if (!animate || finished < shown || shown >= steps.length) return
    const timer = setTimeout(() => setShown(shown + 1), GAP_MS)
    return () => clearTimeout(timer)
  }, [animate, finished, shown, steps.length])

  const visible = animate ? steps.slice(0, shown) : steps
  return (
    <>
      {visible.map((s, i) => (
        <SequenceStep
          key={s.id}
          step={s}
          index={i}
          user={user}
          host={host}
          gated={animate && scrollGated && i > 0}
          onFinished={onFinished}
        />
      ))}
    </>
  )
}

function SequenceStep({
  step,
  index,
  user,
  host,
  gated,
  onFinished,
}: {
  step: SequenceStepData
  index: number
  user: string
  host: string
  gated: boolean
  onFinished: (index: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reached = useReached(ref, gated)
  return (
    <div className="sequence-step" ref={ref}>
      <Prompt id={step.id} command={step.command} user={user} host={host} start={reached} onFinished={() => onFinished(index)}>
        {step.content}
      </Prompt>
    </div>
  )
}
