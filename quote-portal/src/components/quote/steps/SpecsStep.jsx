import { useState } from 'react'
import { ChevronDown, FileText, Info, TriangleAlert } from 'lucide-react'
import { PRODUCT_BY_ID } from '../../../data/catalog.js'
import { DOCUMENTED_POLYMERS, MARKETS, POLYMERS, PROCESSES, labelOf } from '../../../data/options.js'
import { ChipGroup, TextField } from '../../ui/controls.jsx'
import { ProductIcon } from '../../ui/icons.jsx'
import SpecFieldRenderer from '../SpecFieldRenderer.jsx'

function ProductSpecCard({ product, specs, dispatch, errors, showErrors }) {
  const [openFacts, setOpenFacts] = useState(false)
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025]" aria-labelledby={`spec-${product.id}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-ink-900/70 text-brand-lime">
            <ProductIcon name={product.icon} className="size-[1.125rem]" />
          </span>
          <div>
            <h3 id={`spec-${product.id}`} className="font-medium text-white">
              {product.name}
            </h3>
            <p className="text-xs text-ink-400">{product.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {product.grade ? (
            <span className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[0.6875rem] text-ink-300">Grade {product.grade}</span>
          ) : null}
          {product.tds ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-brand-green/40 bg-brand-green/10 px-2 py-0.5 text-[0.6875rem] text-brand-green-light">
              <FileText className="size-3" aria-hidden /> TDS emailed on submit
            </span>
          ) : null}
        </div>
      </header>
      <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
        {product.specFields.map((field) => (
          <div key={field.id} className={field.type === 'chips' || field.type === 'segmented' ? 'md:col-span-2' : ''}>
            <SpecFieldRenderer
              field={field}
              value={specs?.[field.id]}
              onChange={(value) => dispatch({ type: 'setSpec', productId: product.id, fieldId: field.id, value })}
              error={showErrors ? errors[`${product.id}.${field.id}`] : undefined}
            />
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.07] px-5 py-3">
        <button
          type="button"
          onClick={() => setOpenFacts((v) => !v)}
          aria-expanded={openFacts}
          className="inline-flex items-center gap-1.5 text-xs text-ink-400 transition hover:text-white"
        >
          <Info className="size-3.5" aria-hidden />
          Reference data from our product documentation
          <ChevronDown className={`size-3.5 transition ${openFacts ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {openFacts ? (
          <ul className="mt-3 space-y-2 text-[0.8125rem] leading-relaxed text-ink-300">
            {product.knowledge.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-brand-lime" />
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export default function SpecsStep({ state, dispatch, errors, showErrors }) {
  const products = state.productIds.map((id) => PRODUCT_BY_ID[id])
  const documented = [...new Set(state.productIds.flatMap((id) => DOCUMENTED_POLYMERS[id] ?? []))]

  // Flag polymer choices outside what a selected product is documented for.
  const unverified = state.productIds.flatMap((id) => {
    const list = DOCUMENTED_POLYMERS[id]
    if (!list) return []
    const outside = state.application.polymers.filter((p) => p !== 'other' && !list.includes(p))
    return outside.length ? [{ product: PRODUCT_BY_ID[id].name, polymers: outside.map((p) => labelOf(POLYMERS, p)) }] : []
  })

  const setApplication = (patch) => dispatch({ type: 'setApplication', patch })

  return (
    <div className="space-y-6">
      {products.map((product) => (
        <ProductSpecCard
          key={product.id}
          product={product}
          specs={state.specs[product.id]}
          dispatch={dispatch}
          errors={errors}
          showErrors={showErrors}
        />
      ))}

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-5" aria-labelledby="application-title">
        <h3 id="application-title" className="font-medium text-white">
          Application
        </h3>
        <p className="mt-0.5 text-xs text-ink-400">Where the masterbatch goes — this decides carrier, dosage and the right grade.</p>
        <div className="mt-5 space-y-6">
          <ChipGroup
            label="Base polymer"
            required
            multiple
            options={POLYMERS}
            value={state.application.polymers}
            onChange={(polymers) => setApplication({ polymers })}
            markers={documented}
            error={showErrors ? errors.polymers : undefined}
            hint={documented.length ? '● green dot = documented for your selected grades' : undefined}
          />
          {unverified.length ? (
            <div role="status" className="flex gap-3 rounded-xl border border-amber/30 bg-amber/[0.08] p-3 text-[0.8125rem] text-amber-light">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                {unverified.map((item) => (
                  <p key={item.product}>
                    <strong className="font-medium">{item.product}</strong> is not documented for {item.polymers.join(', ')} — our technical team
                    will confirm feasibility in the quotation.
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          <ChipGroup
            label="Conversion process"
            required
            options={PROCESSES}
            value={state.application.process}
            onChange={(process) => setApplication({ process })}
            error={showErrors ? errors.process : undefined}
          />
          <ChipGroup
            label="End market"
            options={MARKETS}
            value={state.application.market}
            onChange={(market) => setApplication({ market })}
          />
          <TextField
            label="Final product"
            placeholder="e.g. 40 µm shrink film for water bottle packs"
            value={state.application.finalProduct}
            onChange={(event) => setApplication({ finalProduct: event.target.value })}
            maxLength={160}
          />
        </div>
      </section>
    </div>
  )
}
