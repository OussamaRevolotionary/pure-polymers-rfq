import { MessageCircle, Route } from 'lucide-react'
import { FAMILY_BY_ID, PRODUCT_BY_ID, familyCodeFor } from '../../data/catalog.js'
import { buildSummary, completeness } from '../../lib/summary.js'
import { whatsappLink } from '../../lib/whatsapp.js'
import InquirySummary from '../confirmation/InquirySummary.jsx'

export default function InquiryBrief({ state }) {
  const summary = buildSummary(state)
  const pct = completeness(state)
  const hasProducts = state.productIds.length > 0
  const code = hasProducts ? familyCodeFor(state.productIds) : '··'
  const team = hasProducts ? FAMILY_BY_ID[PRODUCT_BY_ID[state.productIds[0]].family].team : null

  return (
    <aside className="glass sticky top-24 rounded-3xl p-5" aria-label="Technical inquiry brief">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Technical inquiry brief</p>
          <p className="mt-2 font-mono text-lg tracking-wide text-white">
            #PP-<span className="text-ink-500">····</span>-<span className={hasProducts ? 'text-brand-lime' : 'text-ink-500'}>{code}</span>
          </p>
          <p className="text-xs text-ink-500">Reference number issued on submit</p>
        </div>
        <div className="relative size-14 shrink-0" role="img" aria-label={`${pct}% complete`}>
          <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#becc30"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
              className="transition-[stroke-dasharray] duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-white">{pct}%</span>
        </div>
      </div>

      <div className="scroll-thin mt-5 max-h-[calc(100dvh-22rem)] overflow-y-auto border-t border-white/[0.07] pt-4 pr-1">
        {hasProducts ? (
          <InquirySummary summary={summary} compact hideContact={!state.contact.email && !state.contact.firstName} />
        ) : (
          <p className="text-sm leading-relaxed text-ink-400">
            Your selections appear here as a spec sheet — exactly what our technical team receives. No guesswork on either
            side.
          </p>
        )}
      </div>

      {team ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-ink-900/50 px-3 py-2 text-xs text-ink-300">
          <Route className="size-3.5 text-brand-lime" aria-hidden />
          Routed to <span className="text-white">{team}</span>
        </p>
      ) : null}

      <a
        href={whatsappLink('Hello Pure Polymers, I am filling in a quote request and have a question.')}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-2 text-xs text-ink-400 transition hover:text-white"
      >
        <MessageCircle className="size-3.5" aria-hidden /> Questions while you fill it in? WhatsApp the desk
      </a>
    </aside>
  )
}
