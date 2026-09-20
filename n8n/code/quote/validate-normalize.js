/**
 * Code node · "Validate & Normalize" (run once for all items)
 * In : Webhook item — body is a pp.quote.v1 payload from the quote configurator
 * Out: one item { valid, spam, httpStatus, errors[], config, lead{}, row{} }
 *
 * Nothing downstream re-reads the raw webhook body: this node is the only place
 * that trusts client input, and every field is length-capped and type-checked.
 */

const CONFIG = {
  // 'pilot' → every INTERNAL email goes to pilotRecipient (buyer emails always go to the buyer).
  // Switch to 'live' once Pure Polymers signs off on the routing addresses.
  mode: 'pilot',
  pilotRecipient: 'oussama.g@oussamalabs.com',
  replyTo: 'info@purepolymers.net',
  whatsappE164: '966546460891',
  visualizerUrl: 'https://colorsvisualizer.com/',
  quoteLogUrl: 'https://docs.google.com/spreadsheets/d/1DUd4fQiYWlL86c7_Io0GjQ2oM6u8vcK99Bkw9xXs3ks/edit',
  slaBusinessHours: 18, // 2 business days on a 9 h desk
  desk: { utcOffsetHours: 3, workDays: [0, 1, 2, 3, 4], openHour: 8, closeHour: 17 },
}

const ROUTE_TEAM = {
  color_pigment: 'Color Lab',
  additive: 'Additives Technical Desk',
  compound: 'Compounding Team',
  unclassified: 'Sales Desk (triage)',
}
const FAMILY_ROUTE = { CM: 'color_pigment', WM: 'color_pigment', BM: 'color_pigment', AM: 'additive', PC: 'compound' }
const VOLUME_SCORE = { lt5: 5, '5-25': 15, '25-100': 30, '100-500': 40, gt500: 45, unknown: 8 }
const TIMELINE_SCORE = { urgent: 25, month: 18, quarter: 10, planning: 4 }
const FREE_MAIL = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const first = $input.first().json
const b = first && typeof first.body === 'object' && first.body !== null ? first.body : first
const errors = []

const s = (value, max) => String(value === undefined || value === null ? '' : value).replace(/[\t\r\n]+/g, ' ').trim().slice(0, max || 300)
const lines = (value, max) => String(value === undefined || value === null ? '' : value).replace(/\r/g, '').trim().slice(0, max || 1500)
const labelOf = (option) => (option && typeof option === 'object' ? s(option.label, 80) : '')
const yesNo = (value) => (value ? 'Yes' : 'No')

if (s(b && b.schema, 20) !== 'pp.quote.v1') errors.push('unsupported schema')

const submissionId = s(b && b.submissionId, 64)
if (!/^[0-9a-fA-F-]{16,64}$/.test(submissionId)) errors.push('submissionId missing or malformed')

const reference = s(b && b.reference, 20).toUpperCase()
if (!/^PP-\d{4}-[A-Z]{2}$/.test(reference)) errors.push('reference malformed')

const familyCode = s(b && b.family && b.family.code, 2).toUpperCase()
const route = FAMILY_ROUTE[familyCode] || 'unclassified'

const products = (Array.isArray(b && b.products) ? b.products : [])
  .slice(0, 5)
  .map((p) => ({
    id: s(p && p.id, 40),
    name: s(p && p.name, 80),
    family: s(p && p.family, 20),
    tds: s(p && p.tds, 40),
    specs: (Array.isArray(p && p.specsReadable) ? p.specsReadable : [])
      .slice(0, 14)
      .map((r) => ({ label: s(r && r.label, 80), value: s(r && r.value, 200) }))
      .filter((r) => r.label && r.value),
  }))
  .filter((p) => p.id && p.name)
if (!products.length) errors.push('at least one product is required')

const contact = (b && b.contact) || {}
const email = s(contact.email, 160).toLowerCase()
if (!EMAIL_RE.test(email)) errors.push('valid email is required')
if (!s(contact.firstName, 60)) errors.push('first name is required')
if (!s(contact.company, 100)) errors.push('company is required')
if (!(b && b.consent && b.consent.contact === true)) errors.push('contact consent is required')

// Honeypot: real buyers never see this field.
const spam = s(b && b.hp, 200) !== ''

const application = (b && b.application) || {}
const commercial = (b && b.commercial) || {}
const delivery = commercial.delivery || {}
const source = (b && b.source) || {}

const volumeId = s(commercial.annualVolume && commercial.annualVolume.id, 20)
const timelineId = s(commercial.timeline && commercial.timeline.id, 20)
const phone = s(contact.phone, 40)
const phoneDigits = phone.replace(/\D/g, '')
const domain = email.split('@')[1] || ''
const businessEmail = Boolean(domain) && FREE_MAIL.indexOf(domain) === -1

let score = (VOLUME_SCORE[volumeId] || 0) + (TIMELINE_SCORE[timelineId] || 0)
if (businessEmail) score += 10
if (phoneDigits.length >= 9 && contact.whatsappOptIn === true) score += 5
if (products.some((p) => p.specs.length >= 2)) score += 5
if (s(commercial.targetPrice, 60) || s(commercial.benchmark, 80)) score += 5
if (score > 100) score = 100
const tier = score >= 65 ? 'HOT' : score >= 40 ? 'WARM' : 'NURTURE'

/* Saudi desk calendar: Sunday–Thursday, 08:00–17:00, Asia/Riyadh = UTC+3 year-round. */
const OFFSET_MS = CONFIG.desk.utcOffsetHours * 3600000
const DAY_MS = 86400000
function parts(date) {
  const d = new Date(date.getTime() + OFFSET_MS)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate(), dow: d.getUTCDay(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() }
}
function at(y, m, day, hour) {
  return new Date(Date.UTC(y, m, day, hour, 0) - OFFSET_MS)
}
function nextOpening(after) {
  for (let i = 0; i <= 7; i++) {
    const p = parts(new Date(after.getTime() + i * DAY_MS))
    const opening = at(p.y, p.m, p.day, CONFIG.desk.openHour)
    if (CONFIG.desk.workDays.indexOf(p.dow) !== -1 && opening.getTime() > after.getTime()) return opening
  }
  return new Date(after.getTime() + DAY_MS)
}
function addBusinessHours(start, hours) {
  let remaining = hours * 60
  let cursor = new Date(start)
  for (let guard = 0; guard < 64; guard++) {
    const p = parts(cursor)
    if (CONFIG.desk.workDays.indexOf(p.dow) === -1 || p.minutes >= CONFIG.desk.closeHour * 60) {
      cursor = nextOpening(cursor)
      continue
    }
    if (p.minutes < CONFIG.desk.openHour * 60) {
      cursor = at(p.y, p.m, p.day, CONFIG.desk.openHour)
      continue
    }
    const available = CONFIG.desk.closeHour * 60 - p.minutes
    if (remaining <= available) return new Date(cursor.getTime() + remaining * 60000)
    remaining -= available
    cursor = nextOpening(at(p.y, p.m, p.day, CONFIG.desk.closeHour))
  }
  return cursor
}
const fmt = (date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date) + ' AST'

const receivedAt = new Date()
const slaDue = addBusinessHours(receivedAt, CONFIG.slaBusinessHours)

const polymers = (Array.isArray(application.polymers) ? application.polymers : []).map(labelOf).filter(Boolean).join(', ')
const specsText = products
  .map((p) => p.name + ': ' + (p.specs.map((r) => r.label + ' = ' + r.value).join('; ') || 'no specification given'))
  .join(' | ')
const utm = source.utm && typeof source.utm === 'object'
  ? Object.keys(source.utm).slice(0, 6).map((k) => s(k, 20) + '=' + s(source.utm[k], 60)).join('&')
  : ''

const lead = {
  reference,
  submissionId,
  familyCode,
  route,
  team: ROUTE_TEAM[route],
  tier,
  score,
  receivedAtIso: receivedAt.toISOString(),
  receivedAtLocal: fmt(receivedAt),
  slaDueIso: slaDue.toISOString(),
  slaDueLocal: fmt(slaDue),
  contact: {
    firstName: s(contact.firstName, 60),
    lastName: s(contact.lastName, 60),
    fullName: (s(contact.firstName, 60) + ' ' + s(contact.lastName, 60)).trim(),
    email,
    phone,
    phoneDigits,
    whatsapp: contact.whatsappOptIn === true,
    company: s(contact.company, 100),
    role: labelOf(contact.role),
    channel: s(contact.preferredChannel, 20) || 'email',
    language: contact.language === 'ar' ? 'ar' : 'en',
    businessEmail,
  },
  products,
  application: {
    polymers,
    process: labelOf(application.process),
    market: labelOf(application.market),
    finalProduct: s(application.finalProduct, 160),
  },
  commercial: {
    annualVolume: labelOf(commercial.annualVolume),
    annualVolumeId: volumeId,
    firstOrder: labelOf(commercial.firstOrder),
    timeline: labelOf(commercial.timeline),
    timelineId,
    sampleRequested: commercial.sampleRequested === true,
    country: s(delivery.country, 60),
    city: s(delivery.city, 80),
    incoterm: s(delivery.incoterm, 40),
    targetPrice: s(commercial.targetPrice, 60),
    benchmark: s(commercial.benchmark, 80),
  },
  notes: lines(b && b.notes, 1500),
  source: {
    page: s(source.page, 300),
    referrer: s(source.referrer, 300),
    utm,
    prefilledBy: s(source.prefilledBy, 20),
    locale: s(source.locale, 20),
  },
}

const row = {
  received_at: lead.receivedAtIso,
  reference: lead.reference,
  status: 'New',
  tier: lead.tier,
  score: lead.score,
  route: lead.route,
  team: lead.team,
  sla_due_at: lead.slaDueIso,
  company: lead.contact.company,
  contact_name: lead.contact.fullName,
  role: lead.contact.role,
  email: lead.contact.email,
  phone: lead.contact.phone,
  whatsapp: yesNo(lead.contact.whatsapp),
  preferred_channel: lead.contact.channel,
  language: lead.contact.language,
  products: products.map((p) => p.name).join(' + '),
  product_ids: products.map((p) => p.id).join(','),
  specs: specsText,
  polymers: lead.application.polymers,
  process: lead.application.process,
  market: lead.application.market,
  final_product: lead.application.finalProduct,
  annual_volume: lead.commercial.annualVolume,
  first_order: lead.commercial.firstOrder,
  timeline: lead.commercial.timeline,
  sample: yesNo(lead.commercial.sampleRequested),
  delivery_country: lead.commercial.country,
  delivery_city: lead.commercial.city,
  incoterm: lead.commercial.incoterm,
  target_price: lead.commercial.targetPrice,
  benchmark: lead.commercial.benchmark,
  notes: lead.notes,
  source_page: lead.source.page,
  utm: lead.source.utm,
  prefilled_by: lead.source.prefilledBy,
  submission_id: lead.submissionId,
}

return [
  {
    json: {
      valid: errors.length === 0 && !spam,
      spam,
      // Spam gets a 200 so bots learn nothing; real validation problems get 422.
      httpStatus: spam ? 200 : errors.length ? 422 : 200,
      errors,
      config: CONFIG,
      lead,
      row,
    },
  },
]
