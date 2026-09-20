import { MessageCircle } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { whatsappLink } from '../../lib/whatsapp.js'
import { LogoMark, Wordmark } from './Brand.jsx'

export function DeskStatusPill({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs whitespace-nowrap text-ink-200 ${className}`}
      title={status.detail}
    >
      <span className="relative flex size-2">
        {status.open ? <span className="absolute inset-0 animate-ping rounded-full bg-brand-green/70" /> : null}
        <span className={`relative size-2 rounded-full ${status.open ? 'bg-brand-green' : 'bg-amber'}`} />
      </span>
      {status.label}
    </span>
  )
}

export default function Header({ deskStatus }) {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/55 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a href="https://purepolymers.net" className="flex items-center gap-3" aria-label="Pure Polymers home">
          <LogoMark />
          <Wordmark />
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-ink-300 lg:flex">
          <a className="transition hover:text-white" href="https://purepolymers.net/product-category/product-range/">
            Products
          </a>
          <a className="transition hover:text-white" href="https://colorsvisualizer.com/" target="_blank" rel="noopener noreferrer">
            Colors Visualizer
          </a>
          <a className="transition hover:text-white" href="https://purepolymers.net/about/">
            About
          </a>
          <a className="transition hover:text-white" href="https://purepolymers.net/contact-us/">
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <DeskStatusPill status={deskStatus} />
          </div>
          <Button
            as="a"
            href={whatsappLink('Hello Pure Polymers sales team, I have a question about a quote.')}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="sm"
            icon={MessageCircle}
          >
            <span className="hidden sm:inline">WhatsApp sales</span>
            <span className="sm:hidden">WhatsApp</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
