import { CONFIG } from '../config.js'

export function whatsappLink(text) {
  const base = `https://wa.me/${CONFIG.whatsappE164}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

export function followUpMessage(reference, company) {
  const who = company ? ` from ${company}` : ''
  return `Hello Pure Polymers sales team, this is a follow-up${who} on quote request #${reference}.`
}
