import { FAMILY_BY_ID, PRODUCT_BY_ID } from '../data/catalog.js'
import {
  ANNUAL_VOLUMES,
  CHANNELS,
  FIRST_ORDERS,
  HOME_COUNTRY,
  LANGUAGES,
  MARKETS,
  POLYMERS,
  PROCESSES,
  ROLES,
  TIMELINES,
  labelOf,
} from '../data/options.js'
import { isEmpty } from './validation.js'

export function formatSpecValue(field, value) {
  if (isEmpty(value)) return null
  switch (field.type) {
    case 'toggle':
      return value ? 'Yes' : 'No'
    case 'slider':
      return `${value}${field.unit ?? ''}`
    case 'chips':
      return Array.isArray(value) ? value.join(', ') : String(value)
    default:
      return String(value)
  }
}

export function productSpecRows(productId, specs = {}) {
  const product = PRODUCT_BY_ID[productId]
  return product.specFields
    .map((field) => ({ id: field.id, label: field.label, type: field.type, value: formatSpecValue(field, specs[field.id]) }))
    .filter((row) => row.value !== null)
}

const row = (label, value) => (isEmpty(value) ? null : { label, value })

/** Structured, human-readable view of an inquiry — shared by the brief, confirmation and payload. */
export function buildSummary(state) {
  const { application: a, commercial: c, contact: k } = state
  const products = state.productIds.map((id) => ({
    id,
    name: PRODUCT_BY_ID[id].name,
    family: FAMILY_BY_ID[PRODUCT_BY_ID[id].family].label,
    specs: productSpecRows(id, state.specs[id]),
  }))

  const application = [
    row('Base polymer', a.polymers.map((p) => labelOf(POLYMERS, p)).join(', ')),
    row('Process', a.process && labelOf(PROCESSES, a.process)),
    row('End market', a.market && labelOf(MARKETS, a.market)),
    row('Final product', a.finalProduct),
  ].filter(Boolean)

  const delivery = [c.city, c.country].filter(Boolean).join(', ')
  const commercial = [
    row('Annual volume', c.annualVolume && labelOf(ANNUAL_VOLUMES, c.annualVolume)),
    row('First order', c.firstOrder && labelOf(FIRST_ORDERS, c.firstOrder)),
    row('Timeline', c.timeline && labelOf(TIMELINES, c.timeline)),
    row('Lab sample first', c.sampleRequested ? 'Yes' : 'No'),
    row('Delivery', delivery),
    row('Incoterm', c.country !== HOME_COUNTRY ? c.incoterm : ''),
    row('Target price', c.targetPrice),
    row('Benchmark grade', c.benchmark),
  ].filter(Boolean)

  const phone = k.phone ? `${k.dialCode} ${k.phone}` : ''
  const contact = [
    row('Name', [k.firstName, k.lastName].filter(Boolean).join(' ')),
    row('Company', k.company),
    row('Role', k.role && labelOf(ROLES, k.role)),
    row('Email', k.email),
    row('Phone', phone + (phone && k.whatsappOptIn ? ' (WhatsApp)' : '')),
    row('Preferred channel', labelOf(CHANNELS, k.channel)),
    row('Reply language', labelOf(LANGUAGES, k.language)),
  ].filter(Boolean)

  return { products, application, commercial, contact, notes: k.notes.trim() }
}

export function summaryToText(summary, reference) {
  const lines = []
  if (reference) lines.push(`Quote request #${reference}`)
  for (const p of summary.products) {
    lines.push(`• ${p.name}`)
    for (const s of p.specs) lines.push(`   – ${s.label}: ${s.value}`)
  }
  const section = (title, rows) => {
    if (!rows.length) return
    lines.push(`${title}:`)
    for (const r of rows) lines.push(`   – ${r.label}: ${r.value}`)
  }
  section('Application', summary.application)
  section('Commercial', summary.commercial)
  section('Contact', summary.contact)
  if (summary.notes) lines.push(`Notes: ${summary.notes}`)
  return lines.join('\n')
}

/** Rough completeness score for the live brief (required steps weigh most). */
export function completeness(state) {
  const checks = [
    state.productIds.length > 0,
    state.application.polymers.length > 0,
    Boolean(state.application.process),
    Boolean(state.application.market),
    state.productIds.every((id) => productSpecRows(id, state.specs[id]).length > 0),
    Boolean(state.commercial.annualVolume),
    Boolean(state.commercial.timeline),
    Boolean(state.commercial.firstOrder),
    Boolean(state.contact.email && state.contact.company),
    Boolean(state.contact.phone),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
