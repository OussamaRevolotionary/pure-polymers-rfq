import { FAMILY_BY_ID, PRODUCT_BY_ID } from '../data/catalog.js'
import {
  ANNUAL_VOLUMES,
  FIRST_ORDERS,
  HOME_COUNTRY,
  MARKETS,
  POLYMERS,
  PROCESSES,
  ROLES,
  TIMELINES,
  labelOf,
} from '../data/options.js'
import { buildSummary, productSpecRows, summaryToText } from './summary.js'

const option = (list, id) => (id ? { id, label: labelOf(list, id) } : null)

function utmParams() {
  try {
    const params = new URLSearchParams(window.location.search)
    const utm = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      if (params.get(key)) utm[key] = params.get(key)
    }
    return utm
  } catch {
    return {}
  }
}

/**
 * Wire format for the n8n "Quote Intake" webhook (schema pp.quote.v1).
 * Labels travel with IDs so the sheet stays readable without a lookup table.
 */
export function buildPayload(state, { reference, submissionId, submittedAt }) {
  const family = FAMILY_BY_ID[state.familyId] ?? FAMILY_BY_ID[PRODUCT_BY_ID[state.productIds[0]].family]
  const summary = buildSummary(state)
  const { application: a, commercial: c, contact: k } = state

  return {
    schema: 'pp.quote.v1',
    submissionId,
    reference,
    submittedAt,
    family: { id: family.id, code: family.code, label: family.label },
    products: state.productIds.map((id) => {
      const product = PRODUCT_BY_ID[id]
      return {
        id,
        name: product.name,
        family: product.family,
        tds: product.tds,
        specs: state.specs[id] ?? {},
        specsReadable: productSpecRows(id, state.specs[id]).map(({ label, value }) => ({ label, value })),
      }
    }),
    application: {
      polymers: a.polymers.map((id) => option(POLYMERS, id)),
      process: option(PROCESSES, a.process),
      market: option(MARKETS, a.market),
      finalProduct: a.finalProduct.trim(),
    },
    commercial: {
      annualVolume: option(ANNUAL_VOLUMES, c.annualVolume),
      firstOrder: option(FIRST_ORDERS, c.firstOrder),
      timeline: option(TIMELINES, c.timeline),
      sampleRequested: Boolean(c.sampleRequested),
      delivery: {
        country: c.country,
        city: c.city.trim(),
        incoterm: c.country !== HOME_COUNTRY ? c.incoterm : '',
      },
      targetPrice: c.targetPrice.trim(),
      benchmark: c.benchmark.trim(),
    },
    contact: {
      firstName: k.firstName.trim(),
      lastName: k.lastName.trim(),
      email: k.email.trim().toLowerCase(),
      phone: `${k.dialCode} ${k.phone.trim()}`,
      whatsappOptIn: Boolean(k.whatsappOptIn),
      company: k.company.trim(),
      role: option(ROLES, k.role),
      preferredChannel: k.channel,
      language: k.language,
    },
    notes: k.notes.trim(),
    consent: { contact: Boolean(k.consent), at: submittedAt },
    source: {
      channel: 'web-quote-configurator',
      page: typeof window !== 'undefined' ? window.location.href.split('#')[0] : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      utm: utmParams(),
      prefilledBy: state.prefilledBy,
      locale: typeof navigator !== 'undefined' ? navigator.language : '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    summaryText: summaryToText(summary, reference),
    hp: k.website,
  }
}
