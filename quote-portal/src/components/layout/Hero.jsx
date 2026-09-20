import { motion } from 'motion/react'
import { ArrowDown, FileText, Inbox, Receipt, Sparkles } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { PRODUCTS } from '../../data/catalog.js'
import { formatRiyadh, quotationDueDate } from '../../lib/businessTime.js'
import { DeskStatusPill } from './Header.jsx'

const METRICS = [
  { value: String(PRODUCTS.length), label: 'Product lines, one form' },
  { value: '7 days', label: 'Samples & orders ship (business days)' },
  { value: '2017', label: 'Italian twin-screw extrusion, Jeddah' },
  { value: 'SASO 2879', label: 'd2w® oxo-biodegradable' },
]

export default function Hero({ deskStatus, onStart, onAskAssistant }) {
  const due = quotationDueDate(new Date())
  const promise = [
    {
      icon: Receipt,
      when: 'Instantly',
      title: 'Reference number on screen',
      body: 'Your inquiry is logged with the Modon 3 sales desk the moment you submit.',
    },
    {
      icon: Inbox,
      when: 'Within minutes',
      title: 'Confirmation email with your TDS',
      body: 'Technical data sheets for the grades you selected, attached.',
    },
    {
      icon: FileText,
      when: `By ${formatRiyadh(due, { weekday: 'short', day: 'numeric', month: 'short' })}`,
      title: 'Formal quotation',
      body: 'Priced by the desk that owns your product — within 2 business days.',
    },
  ]

  return (
    <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pt-12 pb-10 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pt-20 lg:pb-14">
      {/* Scrim: keeps pellets drifting behind the headline from fighting the copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 -z-0 w-full bg-[radial-gradient(55%_65%_at_28%_42%,rgba(5,7,10,0.82),rgba(5,7,10,0.45)_55%,transparent_80%)] lg:w-[70%]"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative lg:col-span-7"
      >
        <p className="eyebrow flex items-center gap-2">
          <span className="h-px w-8 bg-brand-lime/70" />
          Request for quotation · Masterbatch &amp; compounding
        </p>
        <h1 className="mt-5 font-display text-[2.35rem] leading-[1.04] font-medium tracking-tight text-balance text-white sm:text-5xl lg:text-[3.65rem]">
          Specify it once.{' '}
          <span className="bg-gradient-to-r from-brand-lime via-brand-green-light to-brand-blue-light bg-clip-text text-transparent">
            Know exactly what happens next.
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
          Configure the exact masterbatch, carrier and process in under two minutes. You get a reference number and your
          technical data sheet straight away, and a formal quotation from our Modon 3 team within two business days.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={onStart} iconRight={ArrowDown}>
            Start your quote
          </Button>
          <Button size="lg" variant="secondary" icon={Sparkles} onClick={onAskAssistant}>
            Not sure? Ask the assistant
          </Button>
        </div>
        <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          {METRICS.map((metric) => (
            <div key={metric.label} className="border-l border-white/10 pl-3">
              <dt className="sr-only">{metric.label}</dt>
              <dd className="font-display text-xl font-medium text-white">{metric.value}</dd>
              <dd className="mt-1 text-xs leading-snug text-ink-400">{metric.label}</dd>
            </div>
          ))}
        </dl>
      </motion.div>

      <motion.aside
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative self-start overflow-hidden rounded-3xl p-6 lg:col-span-5 lg:mt-6"
        aria-label="What happens after you submit"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-lime/60 to-transparent" />
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">After you press submit</p>
          <DeskStatusPill status={deskStatus} />
        </div>
        <ol className="mt-5 space-y-5">
          {promise.map((step, index) => (
            <li key={step.title} className="relative flex gap-4">
              {index < promise.length - 1 ? (
                <span className="absolute top-10 left-[1.1875rem] h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-white/15 to-transparent" />
              ) : null}
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-ink-900/80 text-brand-lime">
                <step.icon className="size-[1.125rem]" aria-hidden />
              </span>
              <div>
                <p className="font-mono text-[0.6875rem] tracking-wider text-brand-lime uppercase">{step.when}</p>
                <p className="mt-0.5 font-medium text-white">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-400">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </motion.aside>
    </section>
  )
}
