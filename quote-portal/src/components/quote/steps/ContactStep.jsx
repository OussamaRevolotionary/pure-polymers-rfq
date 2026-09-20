import { useId, useState } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import { CHANNELS, DIAL_CODES, LANGUAGES, ROLES } from '../../../data/options.js'
import { isFreeMailbox } from '../../../lib/validation.js'
import { buildSummary } from '../../../lib/summary.js'
import { FieldShell, Segmented, SelectField, TextField, Toggle } from '../../ui/controls.jsx'
import InquirySummary from '../../confirmation/InquirySummary.jsx'

export default function ContactStep({ state, dispatch, errors, showErrors }) {
  const k = state.contact
  const set = (patch) => dispatch({ type: 'setContact', patch })
  const err = (key) => (showErrors ? errors[key] : undefined)
  const phoneId = useId()
  const consentId = useId()
  const [reviewOpen, setReviewOpen] = useState(false)
  const freeMail = k.email.includes('@') && isFreeMailbox(k.email)

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-5">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="First name"
            required
            autoComplete="given-name"
            value={k.firstName}
            onChange={(event) => set({ firstName: event.target.value })}
            error={err('firstName')}
            maxLength={60}
          />
          <TextField
            label="Last name"
            required
            autoComplete="family-name"
            value={k.lastName}
            onChange={(event) => set({ lastName: event.target.value })}
            error={err('lastName')}
            maxLength={60}
          />
          <TextField
            label="Work email"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            value={k.email}
            onChange={(event) => set({ email: event.target.value })}
            error={err('email')}
            hint={freeMail ? 'A company email helps us prioritise and verify your account faster.' : 'Your TDS and confirmation are sent here.'}
            maxLength={120}
          />
          <FieldShell label="Phone" required htmlFor={phoneId} error={err('phone')}>
            <div className="flex gap-2">
              <select
                aria-label="Country dial code"
                value={k.dialCode}
                onChange={(event) => set({ dialCode: event.target.value })}
                className="field-input w-[6.5rem] shrink-0"
              >
                {DIAL_CODES.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.country} {d.code}
                  </option>
                ))}
              </select>
              <input
                id={phoneId}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="54 646 0891"
                value={k.phone}
                onChange={(event) => set({ phone: event.target.value.replace(/[^\d\s-]/g, '') })}
                aria-invalid={err('phone') ? 'true' : undefined}
                aria-describedby={err('phone') ? `${phoneId}-error` : undefined}
                className="field-input"
                maxLength={20}
              />
            </div>
          </FieldShell>
          <TextField
            label="Company"
            required
            autoComplete="organization"
            value={k.company}
            onChange={(event) => set({ company: event.target.value })}
            error={err('company')}
            maxLength={100}
          />
          <SelectField label="Your role" options={ROLES} placeholder="Select role" value={k.role} onChange={(role) => set({ role })} />
        </div>
        <div className="mt-5 rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
          <Toggle
            label="This number is on WhatsApp"
            description="Our sales desk can confirm details and share documents there."
            checked={k.whatsappOptIn}
            onChange={(whatsappOptIn) => set({ whatsappOptIn })}
          />
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Segmented label="Preferred reply channel" options={CHANNELS} value={k.channel} onChange={(channel) => set({ channel: channel || 'email' })} />
          <Segmented label="Reply language" options={LANGUAGES} value={k.language} onChange={(language) => set({ language: language || 'en' })} columns={2} />
        </div>
        <TextField
          className="mt-5"
          label="Anything else our technical team should know?"
          multiline
          placeholder="Machine, line speed, current issues, certifications required…"
          value={k.notes}
          onChange={(event) => set({ notes: event.target.value })}
          maxLength={1500}
        />
        {/* Honeypot: invisible to people, tempting to bots. n8n drops submissions that fill it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={k.website} onChange={(event) => set({ website: event.target.value })} />
          </label>
        </div>
      </section>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] lg:hidden">
        <button
          type="button"
          onClick={() => setReviewOpen((v) => !v)}
          aria-expanded={reviewOpen}
          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-white"
        >
          Review your technical inquiry
          <ChevronDown className={`size-4 transition ${reviewOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {reviewOpen ? (
          <div className="border-t border-white/[0.07] px-5 py-4">
            <InquirySummary summary={buildSummary(state)} compact />
          </div>
        ) : null}
      </div>

      <div className={`flex gap-3 rounded-2xl border px-4 py-3.5 ${err('consent') ? 'border-red-400/50' : 'border-white/[0.08]'} bg-white/[0.025]`}>
        <input
          id={consentId}
          type="checkbox"
          checked={k.consent}
          onChange={(event) => set({ consent: event.target.checked })}
          className="mt-0.5 size-4 shrink-0 accent-brand-green"
          aria-invalid={err('consent') ? 'true' : undefined}
        />
        <label htmlFor={consentId} className="text-[0.8125rem] leading-relaxed text-ink-300">
          Pure Polymers may contact me about this request by email, phone or WhatsApp. My details are used only to prepare
          this quotation.
          {err('consent') ? <span className="mt-1 block text-xs text-red-300">{err('consent')}</span> : null}
        </label>
      </div>
      <p className="flex items-center gap-2 text-xs text-ink-500">
        <Lock className="size-3.5" aria-hidden /> Sent securely to the Pure Polymers sales desk and used only for this quotation.
      </p>
    </div>
  )
}
