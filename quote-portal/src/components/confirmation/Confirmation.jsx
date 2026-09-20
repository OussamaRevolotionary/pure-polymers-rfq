import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  CircleCheck,
  CloudOff,
  Copy,
  FileText,
  Hourglass,
  Mail,
  MessageCircle,
  Printer,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { COMPANY, FAMILY_BY_ID, PRODUCT_BY_ID } from '../../data/catalog.js'
import { formatRiyadh, quotationDueDate } from '../../lib/businessTime.js'
import { summaryToText } from '../../lib/summary.js'
import { followUpMessage, whatsappLink } from '../../lib/whatsapp.js'
import Button from '../ui/Button.jsx'
import AuthorityBadges from './AuthorityBadges.jsx'
import InquirySummary from './InquirySummary.jsx'
import StatusTimeline from './StatusTimeline.jsx'
import VisualizerOffer from './VisualizerOffer.jsx'

const STATUS_COPY = {
  delivered: {
    icon: CircleCheck,
    tone: 'text-brand-lime',
    ring: 'border-brand-lime/50 bg-brand-lime/10',
    eyebrow: 'Inquiry received',
    headline: 'It’s logged with our sales desk.',
    badge: 'Logged at Modon 3',
  },
  preview: {
    icon: CircleCheck,
    tone: 'text-brand-lime',
    ring: 'border-brand-lime/50 bg-brand-lime/10',
    eyebrow: 'Inquiry received',
    headline: 'It’s logged with our sales desk.',
    badge: 'Preview mode — connect the n8n webhook to go live',
  },
  queued: {
    icon: CloudOff,
    tone: 'text-amber-light',
    ring: 'border-amber/50 bg-amber/10',
    eyebrow: 'Inquiry saved',
    headline: 'Saved safely — finishing delivery automatically.',
    badge: 'Connection issue · retrying from this device',
  },
  rejected: {
    icon: TriangleAlert,
    tone: 'text-red-300',
    ring: 'border-red-400/50 bg-red-400/10',
    eyebrow: 'Action needed',
    headline: 'We couldn’t log this automatically.',
    badge: 'Please send it with one tap below',
  },
}

function ReferenceCard({ reference }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-950/70 p-5">
      <p className="eyebrow">Your reference</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.35em' }}
          animate={{ opacity: 1, letterSpacing: '0.06em' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="font-mono text-3xl font-medium text-white sm:text-4xl"
        >
          #{reference}
        </motion.p>
        <button
          type="button"
          onClick={copy}
          className="no-print inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-300 transition hover:border-white/25 hover:text-white"
          aria-live="polite"
        >
          <Copy className="size-3.5" aria-hidden /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-400">Quote this number on WhatsApp, phone or email — the desk finds your full spec instantly.</p>
    </div>
  )
}

export default function Confirmation({ result, onRestart, onAskAssistant }) {
  const headingRef = useRef(null)
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  const copy = STATUS_COPY[result.status] ?? STATUS_COPY.delivered
  const submittedAt = new Date(result.submittedAt)
  const due = quotationDueDate(submittedAt)
  const primaryFamily = FAMILY_BY_ID[PRODUCT_BY_ID[result.productIds[0]].family]
  const tdsProducts = result.productIds.map((id) => PRODUCT_BY_ID[id]).filter((p) => p.tds)
  const fullText = summaryToText(result.summary, result.reference)
  const rejected = result.status === 'rejected'

  const timeline = [
    {
      title: 'Received',
      detail: `${formatRiyadh(submittedAt, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} AST`,
      state: rejected ? 'active' : 'done',
    },
    {
      title: 'Technical review',
      detail: `Assigned to the ${primaryFamily.team}`,
      state: rejected ? 'upcoming' : 'active',
    },
    {
      title: 'Formal quotation',
      detail: `By ${formatRiyadh(due, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} AST`,
      state: 'upcoming',
    },
    result.sampleRequested
      ? { title: 'Lab sample dispatch', detail: 'Within 7 business days of approval', state: 'upcoming' }
      : { title: 'Order confirmation', detail: 'On your written approval', state: 'upcoming' },
  ]

  return (
    <div className="print-clean mx-auto max-w-7xl space-y-6 px-4 pt-10 pb-24 sm:px-6 lg:px-8 lg:pt-14">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong overflow-hidden rounded-3xl"
        aria-labelledby="confirmation-title"
      >
        <div className="h-1 bg-gradient-to-r from-brand-green via-brand-lime to-brand-blue" />
        <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:p-10">
          <div>
            <div className="flex items-center gap-3">
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                className={`flex size-12 items-center justify-center rounded-2xl border ${copy.ring}`}
              >
                <copy.icon className={`size-6 ${copy.tone}`} aria-hidden />
              </motion.span>
              <div>
                <p className={`eyebrow ${copy.tone}`}>{copy.eyebrow}</p>
                <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-ink-300">
                  <span className={`size-1.5 rounded-full ${rejected ? 'bg-red-400' : result.status === 'queued' ? 'bg-amber' : 'bg-brand-green'}`} />
                  {copy.badge}
                </p>
              </div>
            </div>
            <h1
              id="confirmation-title"
              ref={headingRef}
              tabIndex={-1}
              className="mt-6 font-display text-[2.1rem] leading-[1.08] font-medium tracking-tight text-balance text-white focus:outline-none sm:text-5xl"
            >
              {copy.headline}
            </h1>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-ink-300">
              {rejected ? (
                <>Nothing is lost — your full specification is ready to send in one tap. Our desk replies on WhatsApp during business hours.</>
              ) : (
                <>
                  Thank you{result.firstName ? `, ${result.firstName}` : ''}. The {primaryFamily.team} now has your complete specification — no
                  back-and-forth needed. You will receive a formal quotation by{' '}
                  <span className="text-white">{formatRiyadh(due, { weekday: 'long', day: 'numeric', month: 'long' })}</span>.
                </>
              )}
            </p>

            {rejected ? (
              <div className="no-print mt-6 flex flex-wrap gap-3">
                <Button as="a" href={whatsappLink(fullText)} target="_blank" rel="noopener noreferrer" variant="whatsapp" icon={MessageCircle}>
                  Send on WhatsApp
                </Button>
                <Button
                  as="a"
                  href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(`Quote request #${result.reference}`)}&body=${encodeURIComponent(fullText)}`}
                  variant="secondary"
                  icon={Mail}
                >
                  Send by email
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <ReferenceCard reference={result.reference} />
            <div className="rounded-2xl border border-white/10 bg-ink-950/70 p-5">
              <p className="eyebrow flex items-center gap-2">
                {result.status === 'queued' ? <Hourglass className="size-3.5" aria-hidden /> : <Mail className="size-3.5" aria-hidden />}
                {result.status === 'preview' ? 'In live mode' : 'Check your inbox'}
              </p>
              <p className="mt-2 text-sm text-ink-200">
                {result.status === 'queued'
                  ? 'Your confirmation email is sent the moment delivery completes.'
                  : result.status === 'preview'
                    ? `${result.email} would now receive the confirmation email.`
                    : rejected
                      ? 'Confirmation is sent once the desk logs your request.'
                      : `A confirmation is on its way to ${result.email}.`}
              </p>
              {tdsProducts.length && !rejected ? (
                <ul className="mt-3 space-y-1.5">
                  {tdsProducts.map((product) => (
                    <li key={product.id} className="flex items-center gap-2 text-xs text-ink-300">
                      <FileText className="size-3.5 text-brand-green-light" aria-hidden />
                      TDS — {product.name}
                      {product.grade ? <span className="font-mono text-ink-500">({product.grade})</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.07] px-6 py-6 sm:px-8 lg:px-10">
          <p className="eyebrow mb-5">What happens next</p>
          <StatusTimeline steps={timeline} />
        </div>
      </motion.section>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
        <VisualizerOffer reference={result.reference} familyId={primaryFamily.id} />
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      >
        <div className="glass rounded-3xl p-6 sm:p-8" aria-labelledby="summary-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Exactly what our team received</p>
              <h2 id="summary-title" className="mt-2 font-display text-2xl font-medium text-white">
                Your technical inquiry
              </h2>
            </div>
            <span className="rounded-lg border border-white/10 px-2.5 py-1 font-mono text-xs text-ink-300">#{result.reference}</span>
          </div>
          <div className="mt-6">
            <InquirySummary summary={result.summary} />
          </div>
        </div>

        <div className="no-print space-y-3">
          <div className="glass rounded-3xl p-6">
            <p className="eyebrow">Keep the conversation moving</p>
            <div className="mt-4 grid gap-2.5">
              <Button
                as="a"
                href={whatsappLink(followUpMessage(result.reference, result.company))}
                target="_blank"
                rel="noopener noreferrer"
                variant="whatsapp"
                icon={MessageCircle}
                className="w-full" wrap
              >
                Continue on WhatsApp with #{result.reference}
              </Button>
              <Button variant="secondary" icon={Sparkles} className="w-full" wrap onClick={() => onAskAssistant(`I just submitted quote #${result.reference}. `)}>
                Ask a technical question while you wait
              </Button>
              <Button variant="secondary" icon={Printer} className="w-full" wrap onClick={() => window.print()}>
                Save inquiry as PDF
              </Button>
              <Button variant="ghost" icon={RotateCcw} className="w-full" wrap onClick={onRestart}>
                Request another product
              </Button>
            </div>
          </div>
          <div className="glass rounded-3xl p-6 text-sm text-ink-400">
            <p className="text-white">Pure Polymers sales desk</p>
            <p className="mt-1">{COMPANY.location}</p>
            <p className="mt-3 font-mono text-xs">
              {COMPANY.phoneMobile} · {COMPANY.phoneOffice}
            </p>
            <p className="font-mono text-xs">{COMPANY.email}</p>
          </div>
        </div>
      </motion.section>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}>
        <AuthorityBadges />
      </motion.div>
    </div>
  )
}
