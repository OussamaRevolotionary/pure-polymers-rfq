import { COMPANY } from '../../data/catalog.js'
import { LogoMark } from './Brand.jsx'

export default function Footer() {
  return (
    <footer className="no-print border-t border-white/[0.06] bg-ink-950/70">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <p className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-200/80">
          Concept mockup built for Pure Polymers by{' '}
          <a
            className="font-semibold text-amber-200 underline decoration-amber-400/40 underline-offset-2 hover:decoration-amber-200"
            href="https://oussamalabs.com"
            target="_blank"
            rel="noreferrer"
          >
            OussamaLabs
          </a>{' '}
          — not the live purepolymers.net page.
        </p>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-ink-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <LogoMark className="size-8" />
          <div>
            <p className="text-ink-200">{COMPANY.legalName}</p>
            <p className="text-xs">
              {COMPANY.location} · Manufacturing since {COMPANY.founded}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs">
          <a className="hover:text-white" href={`tel:${COMPANY.phoneMobile.replace(/\s/g, '')}`}>
            {COMPANY.phoneMobile}
          </a>
          <a className="hover:text-white" href={`tel:${COMPANY.phoneOffice.replace(/\s/g, '')}`}>
            {COMPANY.phoneOffice}
          </a>
          <a className="hover:text-white" href={`mailto:${COMPANY.email}`}>
            {COMPANY.email}
          </a>
        </div>
      </div>
    </footer>
  )
}
