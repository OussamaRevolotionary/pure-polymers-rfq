import { ArrowRight, ClipboardList, MessageCircle, Plus } from 'lucide-react'
import { PRODUCT_BY_ID } from '../../data/catalog.js'
import { labelOf, POLYMERS, PROCESSES, ANNUAL_VOLUMES } from '../../data/options.js'
import { TOOL } from '../../lib/assistant/tools.js'
import { whatsappLink } from '../../lib/whatsapp.js'
import { ProductIcon } from '../ui/icons.jsx'

const ARABIC = /[؀-ۿ]/

function ProductCards({ input, onAddProduct, selectedIds }) {
  return (
    <div className="space-y-2">
      {input.headline ? (
        <p className="eyebrow" dir={ARABIC.test(input.headline) ? 'rtl' : undefined}>
          {input.headline}
        </p>
      ) : null}
      {input.productIds.map((id) => {
        const product = PRODUCT_BY_ID[id]
        const added = selectedIds.includes(id)
        return (
          <div key={id} className="rounded-xl border border-white/10 bg-ink-950/60 p-3">
            <div className="flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-ink-900 text-brand-lime">
                <ProductIcon name={product.icon} className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-medium text-white">{product.name}</p>
                <p className="text-xs leading-snug text-ink-400">{product.tagline}</p>
              </div>
            </div>
            <dl className="mt-2.5 grid grid-cols-1 gap-1">
              {product.keyFacts.map((fact) => (
                <div key={fact.label} className="flex justify-between gap-3 text-[0.6875rem]">
                  <dt className="text-ink-500">{fact.label}</dt>
                  <dd className="text-end text-ink-200">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => onAddProduct(id)}
              disabled={added}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 py-1.5 text-xs text-ink-200 transition hover:border-brand-lime/50 hover:text-white disabled:border-brand-lime/40 disabled:text-brand-lime"
            >
              {added ? 'In your quote' : (
                <>
                  <Plus className="size-3.5" aria-hidden /> Add to quote
                </>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function QuoteFormCard({ input, onOpenForm }) {
  const facts = [
    input.productIds.map((id) => PRODUCT_BY_ID[id].name).join(' + '),
    input.polymers.map((id) => labelOf(POLYMERS, id)).join(', '),
    input.process && labelOf(PROCESSES, input.process),
    input.annualVolume && labelOf(ANNUAL_VOLUMES, input.annualVolume),
  ].filter(Boolean)
  return (
    <div className="rounded-xl border border-brand-lime/40 bg-brand-lime/[0.07] p-3">
      <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-white">
        <ClipboardList className="size-4 text-brand-lime" aria-hidden /> Quote form prefilled
      </p>
      {facts.length ? (
        <ul className="mt-2 space-y-0.5 text-xs text-ink-300">
          {facts.map((fact) => (
            <li key={fact}>· {fact}</li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={() => onOpenForm(input)}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-green py-2 text-xs font-medium text-white transition hover:bg-brand-green-light"
      >
        Review &amp; submit <ArrowRight className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

function WhatsAppCard({ input }) {
  const arabic = input.language === 'ar'
  return (
    <div className="rounded-xl border border-[#1ea952]/40 bg-[#1ea952]/[0.08] p-3" dir={arabic ? 'rtl' : 'ltr'}>
      <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-white">
        <MessageCircle className="size-4 text-[#3ddc84]" aria-hidden />
        {arabic ? 'فريق المبيعات — واتساب' : 'Sales engineers on WhatsApp'}
        {input.urgency === 'high' ? (
          <span className="rounded-full bg-amber/20 px-1.5 py-0.5 text-[0.625rem] text-amber-light">{arabic ? 'عاجل' : 'Priority'}</span>
        ) : null}
      </p>
      {input.message ? (
        <p className="mt-2 line-clamp-4 rounded-lg bg-ink-950/60 p-2 text-[0.6875rem] leading-relaxed text-ink-300">{input.message}</p>
      ) : null}
      <a
        href={whatsappLink(input.message)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1ea952] py-2 text-xs font-medium text-white transition hover:bg-[#22bf5d]"
      >
        {/* Isolated, or the right-to-left card lays the digit groups out backwards: "0891 646 54 966+". */}
        {arabic ? 'متابعة على واتساب' : 'Continue on WhatsApp'} · <bdi dir="ltr">+966 54 646 0891</bdi>
      </a>
    </div>
  )
}

export default function ActionCards({ actions, onAddProduct, onOpenForm, selectedIds }) {
  if (!actions?.length) return null
  return (
    <div className="mt-2.5 space-y-2.5">
      {actions.map((action) => {
        if (action.type === TOOL.SHOW_PRODUCT_CARDS) {
          return <ProductCards key={action.id} input={action.input} onAddProduct={onAddProduct} selectedIds={selectedIds} />
        }
        if (action.type === TOOL.OPEN_QUOTE_FORM) {
          return <QuoteFormCard key={action.id} input={action.input} onOpenForm={onOpenForm} />
        }
        if (action.type === TOOL.HANDOFF_TO_WHATSAPP) {
          return <WhatsAppCard key={action.id} input={action.input} />
        }
        return null
      })}
    </div>
  )
}
