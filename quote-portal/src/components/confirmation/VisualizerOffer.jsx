import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, Palette } from 'lucide-react'
import { CONFIG } from '../../config.js'
import { COMPANY } from '../../data/catalog.js'

const SWATCHES = ['#3249B3', '#E09A2D', '#509C35', '#C8372D', '#F2F4F7', '#0B0D11']

function ProductSilhouettes({ color }) {
  const transition = { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
  return (
    <svg viewBox="0 0 220 150" className="h-full w-full" role="img" aria-label="Products recolored in the selected shade">
      <defs>
        <linearGradient id="viz-shine" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* carrier bag */}
      <motion.path
        d="M18 52h58l-6 86H24z"
        animate={{ fill: color }}
        transition={transition}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      <path d="M34 52c0-22 26-22 26 0" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 52h58l-6 86H24z" fill="url(#viz-shine)" />
      {/* cup */}
      <motion.path d="M92 62h52l-7 76h-38z" animate={{ fill: color }} transition={{ ...transition, delay: 0.08 }} stroke="rgba(255,255,255,0.25)" />
      <rect x="88" y="54" width="60" height="9" rx="4" fill="rgba(255,255,255,0.85)" />
      <path d="M92 62h52l-7 76h-38z" fill="url(#viz-shine)" />
      {/* bottle cap */}
      <motion.rect x="160" y="96" width="46" height="42" rx="7" animate={{ fill: color }} transition={{ ...transition, delay: 0.16 }} stroke="rgba(255,255,255,0.25)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={165 + i * 7} y="102" width="2" height="30" rx="1" fill="rgba(0,0,0,0.22)" />
      ))}
      <rect x="160" y="96" width="46" height="42" rx="7" fill="url(#viz-shine)" />
      {/* pipe */}
      <motion.rect x="150" y="28" width="62" height="20" rx="10" animate={{ fill: color }} transition={{ ...transition, delay: 0.24 }} />
      <ellipse cx="206" cy="38" rx="6" ry="10" fill="rgba(0,0,0,0.35)" />
    </svg>
  )
}

export default function VisualizerOffer({ reference, familyId }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined
    const id = setInterval(() => setIndex((i) => (i + 1) % SWATCHES.length), 1800)
    return () => clearInterval(id)
  }, [])

  const url = new URL(CONFIG.visualizerUrl)
  url.searchParams.set('ref', reference)
  url.searchParams.set('utm_source', 'rfq-confirmation')
  url.searchParams.set('utm_medium', 'web')
  url.searchParams.set('utm_campaign', 'quote-next-step')

  const colorLed = ['color', 'white', 'black', 'compound'].includes(familyId)

  return (
    <section
      aria-labelledby="visualizer-title"
      className="relative overflow-hidden rounded-3xl border border-amber/30 bg-ink-900/85 bg-gradient-to-br from-amber/[0.16] via-ink-900/90 to-brand-blue/[0.14] p-6 backdrop-blur-2xl sm:p-8"
    >
      <div className="absolute -top-24 -right-16 size-72 rounded-full bg-amber/20 blur-3xl" aria-hidden />
      <div className="relative grid items-center gap-8 md:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="eyebrow !text-amber-light">While our lab prices your inquiry</p>
          <h2 id="visualizer-title" className="mt-3 font-display text-3xl leading-tight font-medium text-white sm:text-[2.15rem]">
            {colorLed ? 'See your shade on real products' : 'Planning colored products too?'}
            <span className="block text-amber-light">and take 5% off.</span>
          </h2>
          <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-ink-300">
            Try colors on {COMPANY.visualizerProducts.length} product types — {COMPANY.visualizerProducts.slice(0, 5).join(', ')} and more — in
            the Pure Polymers Colors Visualizer. Mention <span className="font-mono text-white">#{reference}</span> and the 5% visualizer
            offer is noted on your quotation.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href={url.toString()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-amber px-5 font-medium text-ink-950 shadow-[0_14px_34px_-14px_rgba(224,154,45,0.9)] transition hover:bg-amber-light active:scale-[0.98]"
            >
              <Palette className="size-4" aria-hidden /> Open Colors Visualizer <ArrowUpRight className="size-4" aria-hidden />
            </a>
            <span className="text-xs text-ink-400">Opens in a new tab · your inquiry stays logged</span>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[22/15] rounded-2xl border border-white/10 bg-ink-950/60 p-4">
            <ProductSilhouettes color={SWATCHES[index]} />
          </div>
          <div className="mt-3 flex justify-center gap-2" aria-hidden>
            {SWATCHES.map((swatch, i) => (
              <span
                key={swatch}
                className={`size-4 rounded-full border transition ${i === index ? 'scale-125 border-white' : 'border-white/20'}`}
                style={{ background: swatch }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
