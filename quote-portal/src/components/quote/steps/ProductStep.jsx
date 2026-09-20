import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Check, Plus, Search, Sparkles, X } from 'lucide-react'
import { FAMILIES, PRODUCT_BY_ID, productsForFamily } from '../../../data/catalog.js'
import { MAX_PRODUCTS } from '../../../state/quoteState.js'
import { PelletSwatch } from '../../layout/Brand.jsx'
import { ProductIcon } from '../../ui/icons.jsx'

function KeyFacts({ facts }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-xl border border-white/[0.07] bg-ink-900/50 px-3 py-2.5">
          <dt className="font-mono text-[0.625rem] tracking-wider text-ink-400 uppercase">{fact.label}</dt>
          <dd className="mt-1 text-sm text-ink-100">{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function AdditiveCard({ product, selected, disabled, onToggle }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled && !selected}
      onClick={onToggle}
      className={`group relative flex h-full flex-col rounded-2xl border p-4 text-left transition duration-200 ${
        selected
          ? 'border-brand-lime/60 bg-brand-lime/[0.09] shadow-[0_0_0_1px_rgba(190,204,48,0.25)]'
          : 'border-white/[0.08] bg-white/[0.025] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-9 items-center justify-center rounded-xl border ${
            selected ? 'border-brand-lime/40 bg-brand-lime/15 text-brand-lime' : 'border-white/10 bg-ink-900/70 text-ink-300'
          }`}
        >
          <ProductIcon name={product.icon} className="size-[1.125rem]" />
        </span>
        <span
          className={`flex size-5 items-center justify-center rounded-full border transition ${
            selected ? 'border-brand-lime bg-brand-lime text-ink-950' : 'border-white/20 text-transparent group-hover:border-white/40'
          }`}
        >
          <Check className="size-3" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-[0.9375rem] font-medium text-white">{product.name}</p>
      <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-snug text-ink-400">{product.tagline}</p>
      <p className="mt-auto pt-3 font-mono text-[0.6875rem] text-ink-500">
        {product.keyFacts[0].label}: <span className="text-ink-300">{product.keyFacts[0].value}</span>
      </p>
    </button>
  )
}

export default function ProductStep({ state, dispatch, errors, showErrors, onAskAssistant }) {
  const [query, setQuery] = useState('')
  const [showAddOns, setShowAddOns] = useState(false)
  const additives = productsForFamily('additive')
  const atLimit = state.productIds.length >= MAX_PRODUCTS

  const filteredAdditives = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return additives
    return additives.filter((p) => [p.name, p.tagline, ...p.keywords].join(' ').toLowerCase().includes(q))
  }, [query, additives])

  const primary = state.familyId && state.familyId !== 'additive' ? productsForFamily(state.familyId)[0] : null
  const selectedAddOns = state.productIds.filter((id) => PRODUCT_BY_ID[id].family === 'additive')

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-[0.8125rem] font-medium text-ink-200">Product family</legend>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {FAMILIES.map((family) => {
            const active = state.familyId === family.id
            return (
              <button
                key={family.id}
                type="button"
                aria-pressed={active}
                onClick={() => dispatch({ type: 'selectFamily', familyId: family.id })}
                className={`relative flex flex-col items-start rounded-2xl border p-3.5 text-left transition duration-200 ${
                  active
                    ? 'border-brand-lime/60 bg-gradient-to-b from-brand-lime/[0.12] to-transparent'
                    : 'border-white/[0.08] bg-white/[0.025] hover:-translate-y-0.5 hover:border-white/20'
                } ${family.id === 'compound' ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <div className="flex w-full items-start justify-between">
                  <PelletSwatch family={family.id} />
                  <span
                    className={`rounded-md border px-1.5 py-0.5 font-mono text-[0.625rem] ${
                      active ? 'border-brand-lime/50 text-brand-lime' : 'border-white/10 text-ink-400'
                    }`}
                  >
                    {family.code}
                  </span>
                </div>
                <span className="mt-2.5 text-sm font-medium text-white">{family.label}</span>
                <span className="mt-1 text-xs leading-snug text-ink-400">{family.blurb}</span>
              </button>
            )
          })}
        </div>
        {showErrors && errors.products ? (
          <p role="alert" className="mt-2 text-xs text-red-300">
            {errors.products}
          </p>
        ) : null}
      </fieldset>

      <div className="relative">
      <AnimatePresence mode="popLayout" initial={false}>
        {state.familyId === 'additive' ? (
          <motion.div
            key="additives"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.8125rem] font-medium text-ink-200">Choose additives</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  Select up to {MAX_PRODUCTS} — combination packages (e.g. slip + antiblock) are produced as one masterbatch.
                </p>
              </div>
              <label className="relative block sm:w-64">
                <span className="sr-only">Search additives by name or problem</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search: moisture, haze, fog…"
                  className="field-input pl-9"
                />
              </label>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredAdditives.map((product) => (
                <AdditiveCard
                  key={product.id}
                  product={product}
                  selected={state.productIds.includes(product.id)}
                  disabled={atLimit}
                  onToggle={() => dispatch({ type: 'toggleProduct', productId: product.id })}
                />
              ))}
            </div>
            {filteredAdditives.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-ink-300">
                No additive matches “{query}”.{' '}
                <button type="button" onClick={() => onAskAssistant(`I have this problem: ${query}`)} className="text-brand-lime underline-offset-4 hover:underline">
                  Describe the problem to our assistant
                </button>{' '}
                and it will recommend a solution.
              </div>
            ) : null}
          </motion.div>
        ) : primary ? (
          <motion.div
            key={primary.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-brand-lime/40 bg-brand-lime/10 text-brand-lime">
                  <ProductIcon name={primary.icon} className="size-5" />
                </span>
                <div>
                  <p className="font-medium text-white">{primary.name}</p>
                  <p className="text-sm text-ink-400">{primary.tagline}</p>
                </div>
              </div>
              <a
                href={primary.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ink-400 transition hover:text-white"
              >
                Product page <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </div>
            <div className="mt-4">
              <KeyFacts facts={primary.keyFacts} />
            </div>

            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <button
                type="button"
                onClick={() => setShowAddOns((v) => !v)}
                aria-expanded={showAddOns || selectedAddOns.length > 0}
                className="inline-flex items-center gap-2 text-sm text-ink-200 transition hover:text-white"
              >
                <Plus className={`size-4 transition ${showAddOns ? 'rotate-45' : ''}`} aria-hidden />
                Add functional additives to the same masterbatch
                {selectedAddOns.length ? <span className="text-brand-lime">({selectedAddOns.length})</span> : null}
              </button>
              {showAddOns || selectedAddOns.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {additives
                    .filter((p) => p.id !== 'custom-additive')
                    .map((product) => {
                      const selected = state.productIds.includes(product.id)
                      return (
                        <button
                          key={product.id}
                          type="button"
                          aria-pressed={selected}
                          disabled={atLimit && !selected}
                          onClick={() => dispatch({ type: 'toggleProduct', productId: product.id })}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] transition ${
                            selected
                              ? 'border-brand-lime/60 bg-brand-lime/15 text-white'
                              : 'border-white/10 text-ink-300 hover:border-white/25 hover:text-ink-100'
                          } disabled:opacity-40`}
                        >
                          <ProductIcon name={product.icon} className="size-3.5" />
                          {product.name.replace(' Masterbatch', '')}
                        </button>
                      )
                    })}
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-white/12 p-5 text-sm text-ink-400"
          >
            Pick a family above. Every field that follows adapts to that product’s actual technical parameters.
          </motion.p>
        )}
      </AnimatePresence>
      </div>

      {state.productIds.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.07] bg-ink-900/40 p-3">
          <span className="eyebrow mr-1">In this inquiry</span>
          {state.productIds.map((id) => (
            <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] py-1 pr-1 pl-3 text-[0.8125rem] text-white">
              {PRODUCT_BY_ID[id].name}
              <button
                type="button"
                onClick={() => dispatch({ type: 'toggleProduct', productId: id })}
                className="rounded-full p-1 text-ink-400 transition hover:bg-white/10 hover:text-white"
                aria-label={`Remove ${PRODUCT_BY_ID[id].name}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onAskAssistant()}
        className="group flex w-full items-center gap-3 rounded-2xl border border-brand-blue/30 bg-brand-blue/[0.08] p-4 text-left transition hover:border-brand-blue/60"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-blue/25 text-brand-blue-light">
          <Sparkles className="size-[1.125rem]" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium text-white">Not sure which grade solves your problem?</span>
          <span className="block text-xs text-ink-400">
            Describe the defect or application — the assistant recommends products and fills this form for you.
          </span>
        </span>
        <ArrowUpRight className="size-4 text-ink-400 transition group-hover:text-white" aria-hidden />
      </button>
    </div>
  )
}
