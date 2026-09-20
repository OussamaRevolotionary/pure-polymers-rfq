import { COMPANY } from './data/catalog.js'

const env = import.meta.env

export const CONFIG = {
  /** n8n "B — Quote Intake" production webhook. Empty => preview mode (nothing is sent). */
  quoteWebhookUrl: (env.VITE_QUOTE_WEBHOOK_URL ?? '').trim(),
  /** n8n "A — AI Assistant" production webhook. Empty => built-in offline demo engine. */
  assistantUrl: (env.VITE_ASSISTANT_URL ?? '').trim(),
  whatsappE164: (env.VITE_WHATSAPP_E164 ?? COMPANY.whatsappE164).replace(/\D/g, ''),
  visualizerUrl: COMPANY.visualizerUrl,

  /**
   * Sales desk hours in Saudi time. Asia/Riyadh is UTC+3 all year (no DST).
   * Work week Sunday–Thursday. Adjust to the desk's real roster before go-live.
   */
  desk: {
    utcOffsetHours: 3,
    workDays: [0, 1, 2, 3, 4],
    openHour: 8,
    closeHour: 17,
  },
  /** Formal quotation promise: 2 business days (desk runs 9 h/day). */
  quoteSlaBusinessHours: 18,

  submitTimeoutMs: 15000,
  assistantTimeoutMs: 45000,
}
