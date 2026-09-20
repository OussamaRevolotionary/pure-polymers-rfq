/**
 * Shared option sets for the quote configurator, the n8n payload and the
 * agent's `open_quote_form` tool enums. IDs are stable API values; labels are
 * what sales sees in the sheet.
 */

const PE = ['ldpe', 'lldpe', 'mlldpe', 'hdpe', 'rpe']
const PP = ['pp-homo', 'pp-random', 'pp-copo', 'rpp']

export const POLYMERS = [
  { id: 'ldpe', label: 'LDPE' },
  { id: 'lldpe', label: 'LLDPE' },
  { id: 'mlldpe', label: 'mLLDPE' },
  { id: 'hdpe', label: 'HDPE' },
  { id: 'pp-homo', label: 'PP homopolymer' },
  { id: 'pp-random', label: 'PP random copolymer' },
  { id: 'pp-copo', label: 'PP impact copolymer' },
  { id: 'gpps', label: 'GPPS' },
  { id: 'hips', label: 'HIPS' },
  { id: 'abs', label: 'ABS' },
  { id: 'pet', label: 'PET' },
  { id: 'pa', label: 'PA (nylon)' },
  { id: 'pc', label: 'PC' },
  { id: 'pbt', label: 'PBT' },
  { id: 'eva', label: 'EVA' },
  { id: 'pvc', label: 'PVC' },
  { id: 'rpe', label: 'Recycled PE' },
  { id: 'rpp', label: 'Recycled PP' },
  { id: 'bio', label: 'Starch-based / bio' },
  { id: 'other', label: 'Other' },
]

export const PROCESSES = [
  { id: 'blown-film', label: 'Blown film' },
  { id: 'cast-film', label: 'Cast film' },
  { id: 'injection', label: 'Injection molding' },
  { id: 'blow-molding', label: 'Blow molding' },
  { id: 'sheet', label: 'Sheet extrusion' },
  { id: 'pipe-profile', label: 'Pipe & profile' },
  { id: 'fiber-raffia', label: 'Fiber & raffia' },
  { id: 'thermoforming', label: 'Thermoforming' },
  { id: 'rotomolding', label: 'Rotomolding' },
  { id: 'compounding', label: 'Compounding' },
  { id: 'cable', label: 'Wire & cable' },
]

export const MARKETS = [
  { id: 'flexible-packaging', label: 'Flexible packaging' },
  { id: 'rigid-packaging', label: 'Rigid packaging' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'construction', label: 'Construction & pipes' },
  { id: 'consumer', label: 'Consumer goods' },
  { id: 'medical-hygiene', label: 'Medical & hygiene' },
  { id: 'automotive', label: 'Automotive & transport' },
  { id: 'electrical', label: 'Electrical & electronics' },
  { id: 'textiles', label: 'Textiles & fibers' },
  { id: 'other', label: 'Other' },
]

export const ANNUAL_VOLUMES = [
  { id: 'lt5', label: '< 5 t / yr', score: 5 },
  { id: '5-25', label: '5–25 t / yr', score: 15 },
  { id: '25-100', label: '25–100 t / yr', score: 30 },
  { id: '100-500', label: '100–500 t / yr', score: 40 },
  { id: 'gt500', label: '> 500 t / yr', score: 45 },
  { id: 'unknown', label: 'Not sure yet', score: 8 },
]

export const FIRST_ORDERS = [
  { id: 'sample', label: 'Lab sample' },
  { id: 'trial', label: 'Trial lot (≤ 1 t)' },
  { id: 'production', label: 'Production lot (1–10 t)' },
  { id: 'contract', label: 'Contract / call-off' },
]

export const TIMELINES = [
  { id: 'urgent', label: 'Urgent (< 2 weeks)', score: 25 },
  { id: 'month', label: 'Within a month', score: 18 },
  { id: 'quarter', label: 'This quarter', score: 10 },
  { id: 'planning', label: 'Planning / budgeting', score: 4 },
]

export const COUNTRIES = [
  'Saudi Arabia',
  'United Arab Emirates',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
  'Egypt',
  'Jordan',
  'Iraq',
  'Yemen',
  'Sudan',
  'Other',
]

export const HOME_COUNTRY = 'Saudi Arabia'

export const INCOTERMS = ['EXW Jeddah', 'FCA Jeddah', 'FOB Jeddah Islamic Port', 'CFR', 'CIF', 'DAP']

export const ROLES = [
  { id: 'procurement', label: 'Procurement / purchasing' },
  { id: 'production', label: 'Production / plant' },
  { id: 'rnd-quality', label: 'R&D / quality' },
  { id: 'management', label: 'Owner / management' },
  { id: 'trading', label: 'Trading / distribution' },
  { id: 'other', label: 'Other' },
]

export const CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone call' },
  { id: 'whatsapp', label: 'WhatsApp' },
]

export const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
]

export const DIAL_CODES = [
  { code: '+966', country: 'SA' },
  { code: '+971', country: 'AE' },
  { code: '+965', country: 'KW' },
  { code: '+974', country: 'QA' },
  { code: '+973', country: 'BH' },
  { code: '+968', country: 'OM' },
  { code: '+20', country: 'EG' },
  { code: '+962', country: 'JO' },
  { code: '+964', country: 'IQ' },
  { code: '+967', country: 'YE' },
  { code: '+249', country: 'SD' },
]

/**
 * Polymers each product is documented for on purepolymers.net. Used to mark
 * "documented" chips and to flag combinations the technical team must confirm.
 * Products absent from this map have no documented restriction.
 */
export const DOCUMENTED_POLYMERS = {
  'white-masterbatch': ['lldpe', 'ldpe', 'hdpe', ...PP],
  'black-masterbatch': ['abs', 'gpps', 'hips', 'ldpe', 'lldpe', 'hdpe', ...PP],
  desiccant: ['ldpe', 'lldpe', 'hdpe', 'rpe', ...PP, 'bio'],
  antifog: ['ldpe', 'lldpe', 'mlldpe', ...PP, 'pvc', 'eva'],
  clarifier: ['pp-homo', 'pp-random'],
  cling: ['lldpe', 'mlldpe'],
  'process-aid': [...PE, ...PP, 'gpps', 'pa'],
  'impact-modifier': [...PE, ...PP, 'gpps', 'hips', 'abs', 'pa', 'pet', 'pc', 'pbt'],
  antiblock: [...PE, ...PP, 'pa'],
  antistatic: [...PE, ...PP],
  slip: [...PE, ...PP],
  antioxidant: [...PE, ...PP],
  'optical-brightener': [...PE, ...PP],
  'precolored-compound': [...PE, ...PP, 'gpps', 'hips', 'abs'],
}

export const labelOf = (list, id) => list.find((o) => o.id === id)?.label ?? id
