import { Check } from 'lucide-react'
import { STEPS } from '../../state/quoteState.js'

export default function Stepper({ step, maxReachable, onGoto }) {
  const progress = ((step + 1) / STEPS.length) * 100
  return (
    <nav aria-label="Quote steps">
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-white">{STEPS[step].title}</span>
          <span className="font-mono text-xs text-ink-400">
            Step {step + 1} / {STEPS.length}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-brand-lime transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <ol className="hidden grid-cols-4 gap-2 sm:grid">
        {STEPS.map((item, index) => {
          const done = index < step
          const current = index === step
          const reachable = index <= Math.max(step, maxReachable)
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onGoto(index)}
                aria-current={current ? 'step' : undefined}
                className="group flex w-full flex-col gap-2 text-left disabled:cursor-not-allowed"
              >
                <span className={`h-1 rounded-full transition ${done || current ? 'bg-brand-lime' : 'bg-white/10'}`} />
                <span className="flex items-center gap-2">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border font-mono text-[0.6875rem] transition ${
                      done
                        ? 'border-brand-lime bg-brand-lime text-ink-950'
                        : current
                          ? 'border-brand-lime text-brand-lime'
                          : 'border-white/15 text-ink-500'
                    }`}
                  >
                    {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate text-[0.8125rem] font-medium ${current ? 'text-white' : done ? 'text-ink-200' : 'text-ink-500'}`}>
                      {item.title}
                    </span>
                    <span className="hidden truncate text-[0.6875rem] text-ink-500 lg:block">{item.caption}</span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
