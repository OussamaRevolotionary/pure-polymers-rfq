import { ArrowUpRight } from 'lucide-react'
import { AUTHORITY } from '../../data/catalog.js'

/* Original emblems (not third-party logos) so the badges stay trademark-safe. */
const EMBLEMS = {
  'pif-accelerator': (
    <svg viewBox="0 0 48 48" className="size-12" aria-hidden>
      <path d="M24 3 42 13.5v21L24 45 6 34.5v-21z" fill="none" stroke="#becc30" strokeWidth="1.5" />
      <path d="M15 30 24 21l9 9" fill="none" stroke="#becc30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 22 24 13l9 9" fill="none" stroke="#509c35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 21v16" stroke="#becc30" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  'd2w-symphony': (
    <svg viewBox="0 0 48 48" className="size-12" aria-hidden>
      <circle cx="24" cy="24" r="21" fill="none" stroke="#509c35" strokeWidth="1.5" />
      <path d="M14 30c0-11 8-17 21-18-1 13-7 21-18 21-1 0-2 0-3-.5" fill="rgba(190,204,48,0.18)" stroke="#becc30" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 36c5-6 10-10 16-13" fill="none" stroke="#becc30" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'twin-screw': (
    <svg viewBox="0 0 48 48" className="size-12" aria-hidden>
      <rect x="4" y="12" width="40" height="24" rx="12" fill="none" stroke="#6b82ef" strokeWidth="1.5" />
      <path d="M8 20c4-6 8 6 12 0s8 6 12 0 8 6 8 0" fill="none" stroke="#6b82ef" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 28c4 6 8-6 12 0s8-6 12 0 8-6 8 0" fill="none" stroke="#becc30" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'lab-sampling': (
    <svg viewBox="0 0 48 48" className="size-12" aria-hidden>
      <circle cx="24" cy="24" r="21" fill="none" stroke="#e09a2d" strokeWidth="1.5" />
      <path d="M20 12h8M21 12v9l-8 13a3 3 0 0 0 2.6 4.5h16.8A3 3 0 0 0 35 34l-8-13v-9" fill="none" stroke="#f4c472" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16.5 30h15" stroke="#e09a2d" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

export default function AuthorityBadges() {
  return (
    <section aria-labelledby="authority-title" className="glass-strong rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Why buyers commit to Pure Polymers</p>
          <h2 id="authority-title" className="mt-2 font-display text-2xl font-medium text-white">
            A Saudi manufacturer backed by national and global partners
          </h2>
        </div>
        <p className="text-xs text-ink-500">Modon 3 · Jeddah · Kingdom of Saudi Arabia</p>
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {AUTHORITY.map((badge) => (
          <li
            key={badge.id}
            className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-white/20"
          >
            <div className="flex items-start justify-between gap-3">
              {EMBLEMS[badge.id]}
              <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[0.625rem] text-ink-300">{badge.date}</span>
            </div>
            <p className="mt-4 font-medium text-white">{badge.title}</p>
            <p className="mt-0.5 text-xs text-brand-lime">{badge.issuer}</p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-400">{badge.detail}</p>
            <a
              href={badge.source}
              target="_blank"
              rel="noopener noreferrer"
              className="no-print mt-auto inline-flex items-center gap-1 pt-4 text-xs text-ink-400 transition group-hover:text-white"
            >
              Source on purepolymers.net <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
