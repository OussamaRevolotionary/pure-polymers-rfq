import { Check } from 'lucide-react'

/** steps: [{ title, detail, state: 'done' | 'active' | 'upcoming' }] */
export default function StatusTimeline({ steps }) {
  return (
    <ol className="grid gap-4 md:grid-cols-4 md:gap-0">
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex gap-3 md:flex-col md:gap-3 md:pr-4">
          {index < steps.length - 1 ? (
            <span
              aria-hidden
              className={`absolute top-8 left-[0.9375rem] h-[calc(100%-1rem)] w-px md:top-[0.9375rem] md:left-8 md:h-px md:w-[calc(100%-2rem)] ${
                step.state === 'done' ? 'bg-brand-lime/60' : 'bg-white/10'
              }`}
            />
          ) : null}
          <span
            className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border ${
              step.state === 'done'
                ? 'border-brand-lime bg-brand-lime text-ink-950'
                : step.state === 'active'
                  ? 'border-brand-lime/70 bg-ink-900 text-brand-lime'
                  : 'border-white/15 bg-ink-900 text-ink-500'
            }`}
          >
            {step.state === 'done' ? (
              <Check className="size-4" aria-hidden />
            ) : step.state === 'active' ? (
              <span className="size-2.5 animate-pulse-soft rounded-full bg-brand-lime" />
            ) : (
              <span className="font-mono text-xs">{index + 1}</span>
            )}
          </span>
          <div className="pb-1">
            <p className={`text-sm font-medium ${step.state === 'upcoming' ? 'text-ink-300' : 'text-white'}`}>{step.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{step.detail}</p>
            <span className="sr-only">
              {step.state === 'done' ? 'completed' : step.state === 'active' ? 'in progress' : 'upcoming'}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
