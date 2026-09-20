import { FAMILY_BY_ID, PRODUCT_BY_ID, productsForFamily } from '../data/catalog.js'
import { HOME_COUNTRY } from '../data/options.js'

export const STEPS = [
  { id: 'product', title: 'Product', caption: 'What do you need?' },
  { id: 'specs', title: 'Specification', caption: 'Technical requirements' },
  { id: 'volume', title: 'Volume & delivery', caption: 'Commercial scope' },
  { id: 'contact', title: 'Contact & submit', caption: 'Where we reply' },
]

export const MAX_PRODUCTS = 5

export const initialQuoteState = {
  step: 0,
  familyId: null,
  productIds: [],
  specs: {},
  application: { polymers: [], process: '', market: '', finalProduct: '' },
  commercial: {
    annualVolume: '',
    firstOrder: '',
    timeline: '',
    sampleRequested: true,
    country: HOME_COUNTRY,
    city: '',
    incoterm: '',
    targetPrice: '',
    benchmark: '',
  },
  contact: {
    firstName: '',
    lastName: '',
    email: '',
    dialCode: '+966',
    phone: '',
    whatsappOptIn: true,
    company: '',
    role: '',
    channel: 'email',
    language: 'en',
    notes: '',
    consent: false,
    website: '',
  },
  attempted: {},
  prefilledBy: null,
  prefillBannerDismissed: false,
}

function defaultSpecs(productId) {
  const product = PRODUCT_BY_ID[productId]
  const specs = {}
  for (const field of product?.specFields ?? []) {
    if (field.default !== undefined) specs[field.id] = field.default
  }
  return specs
}

function withProducts(state, productIds) {
  const unique = [...new Set(productIds)].filter((id) => PRODUCT_BY_ID[id]).slice(0, MAX_PRODUCTS)
  const specs = {}
  for (const id of unique) specs[id] = state.specs[id] ?? defaultSpecs(id)
  return { ...state, productIds: unique, specs }
}

export function quoteReducer(state, action) {
  switch (action.type) {
    case 'goto':
      return { ...state, step: Math.max(0, Math.min(STEPS.length - 1, action.step)) }

    case 'attempt':
      return { ...state, attempted: { ...state.attempted, [action.step]: true } }

    case 'selectFamily': {
      if (!FAMILY_BY_ID[action.familyId]) return state
      const members = productsForFamily(action.familyId).map((p) => p.id)
      // Additive combinations stay attached when switching the primary family.
      const keptAdditives = state.productIds.filter((id) => PRODUCT_BY_ID[id].family === 'additive')
      if (members.length === 1) {
        return { ...withProducts(state, [members[0], ...keptAdditives]), familyId: action.familyId }
      }
      return { ...withProducts(state, keptAdditives), familyId: action.familyId }
    }

    case 'toggleProduct': {
      const has = state.productIds.includes(action.productId)
      if (has) {
        return withProducts(state, state.productIds.filter((id) => id !== action.productId))
      }
      if (state.productIds.length >= MAX_PRODUCTS) return state
      const next = withProducts(state, [...state.productIds, action.productId])
      return next.familyId ? next : { ...next, familyId: PRODUCT_BY_ID[action.productId].family }
    }

    case 'setSpec':
      return {
        ...state,
        specs: {
          ...state.specs,
          [action.productId]: { ...state.specs[action.productId], [action.fieldId]: action.value },
        },
      }

    case 'setApplication':
      return { ...state, application: { ...state.application, ...action.patch } }

    case 'setCommercial':
      return { ...state, commercial: { ...state.commercial, ...action.patch } }

    case 'setContact':
      return { ...state, contact: { ...state.contact, ...action.patch } }

    case 'prefill': {
      const p = action.prefill
      const productIds = (p.productIds ?? []).filter((id) => PRODUCT_BY_ID[id])
      let next = productIds.length ? withProducts(state, productIds) : state
      if (productIds.length) next = { ...next, familyId: PRODUCT_BY_ID[productIds[0]].family }
      next = {
        ...next,
        application: {
          ...next.application,
          polymers: p.polymers?.length ? p.polymers : next.application.polymers,
          process: p.process || next.application.process,
          market: p.market || next.application.market,
        },
        commercial: {
          ...next.commercial,
          annualVolume: p.annualVolume || next.commercial.annualVolume,
          timeline: p.timeline || next.commercial.timeline,
          sampleRequested: p.sampleRequested ?? next.commercial.sampleRequested,
        },
        contact: {
          ...next.contact,
          notes: p.notes ? [next.contact.notes, p.notes].filter(Boolean).join('\n') : next.contact.notes,
          language: p.language || next.contact.language,
        },
        prefilledBy: 'assistant',
        prefillBannerDismissed: false,
      }
      return { ...next, step: productIds.length ? 1 : 0 }
    }

    case 'dismissPrefillBanner':
      return { ...state, prefillBannerDismissed: true }

    case 'restart':
      // Keep who the buyer is; clear what they asked for.
      return { ...initialQuoteState, contact: { ...state.contact, notes: '', consent: false } }

    default:
      return state
  }
}
