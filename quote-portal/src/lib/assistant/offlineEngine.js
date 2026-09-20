import { COMPANY, PRODUCTS, PRODUCT_BY_ID } from '../../data/catalog.js'
import { ANNUAL_VOLUMES, POLYMERS, PROCESSES, labelOf } from '../../data/options.js'
import { TOOL } from './tools.js'

/**
 * Deterministic stand-in for the AI assistant when no backend is configured.
 * Same output contract ({ reply, actions }) and the same routing policy as the
 * system prompt: answer from the catalog, qualify, push to the form, hand off
 * to WhatsApp for anything regulatory, custom or urgent.
 */

const ARABIC = /[؀-ۿ]/

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const keywordRe = (kw) =>
  ARABIC.test(kw) ? new RegExp(escapeRe(kw)) : new RegExp(`(?<![A-Za-z0-9])${escapeRe(kw)}(?![A-Za-z0-9])`, 'i')
// Single generic words ("White", "Black", "Color") only count as a name hit with "masterbatch" attached.
const GENERIC_NAMES = { 'color-masterbatch': /\bcolou?r\s*(masterbatch|mb)\b/i, 'white-masterbatch': /\bwhite\s*(masterbatch|mb)\b/i, 'black-masterbatch': /\bblack\s*(masterbatch|mb)\b/i }
const PRODUCT_MATCHERS = PRODUCTS.map((product) => ({
  product,
  name: GENERIC_NAMES[product.id] ?? new RegExp(`\\b${escapeRe(product.name.split(' (')[0].replace(' Masterbatch', ''))}\\b`, 'i'),
  keywords: product.keywords.map(keywordRe),
}))

const POLYMER_PATTERNS = [
  ['mlldpe', /\bm-?lldpe\b|metallocene/i],
  ['lldpe', /\blldpe\b/i],
  ['ldpe', /\bldpe\b/i],
  ['hdpe', /\bhdpe\b/i],
  ['pp-random', /random\s*co-?polymer|\bpp-?r\b|\brcp\b/i],
  ['pp-copo', /impact\s*co-?polymer|block\s*co-?polymer/i],
  ['pp-homo', /homo-?polymer|\bpp-?h\b/i],
  ['gpps', /\bgpps\b/i],
  ['hips', /\bhips\b/i],
  ['abs', /\babs\b/i],
  ['pet', /\bpet\b/i],
  ['pa', /\bnylon\b|polyamide|\bpa ?6{1,2}\b/i],
  ['pc', /polycarbonate/i],
  ['pbt', /\bpbt\b/i],
  ['eva', /\beva\b/i],
  ['pvc', /\bpvc\b/i],
  ['rpe', /recycled\s*(pe|polyethylene)|\br-?pe\b|pe\s*regrind/i],
  ['rpp', /recycled\s*(pp|polypropylene)|\br-?pp\b/i],
]

const PROCESS_PATTERNS = [
  ['blown-film', /blown\s*film|film\s*blowing/i],
  ['cast-film', /cast\s*film/i],
  ['blow-molding', /blow[\s-]?mou?ld/i],
  ['injection', /injection/i],
  ['thermoforming', /thermoform/i],
  ['rotomolding', /roto[\s-]?mou?ld/i],
  ['pipe-profile', /\bpipes?\b|\bprofiles?\b/i],
  ['fiber-raffia', /\bfib(er|re)s?\b|raffia|\byarn\b|woven\s*sacks?/i],
  ['sheet', /\bsheets?\b/i],
  ['cable', /\bcables?\b|\bwire\b/i],
  ['compounding', /\bcompounding\b/i],
]

const INTENT = {
  human: /whats\s?app|call me|phone call|speak (to|with)|talk (to|with)|human|real person|sales (rep|person|team|manager)|representative|contact (me|sales)/i,
  account: /complain|complaint|my order|order status|delivery status|invoice|refund|return(ed)? (goods|material)|wrong (color|colour|batch)|claim/i,
  regulatory: /\bfda\b|10\/2011|\breach\b|rohs|halal|iso ?22196|migration test|food[\s-]contact (cert|approv|complian|declar)|medical[\s-]grade|usp class|ul ?94|\bv-?0\b|halogen[\s-]free|sfda|certificate/i,
  custom: /custom formulation|formulate|develop (a|an) new|failure analysis|root cause|co-?develop|tolling/i,
  commercial: /discount|negotiat|best price|distributor|exclusiv|agency|credit terms|payment terms/i,
  quote: /\bprice|pricing|quot(e|ation)|\bcost|how much|\bmoq\b|minimum order|lead time|\bsamples?\b|\btds\b|data ?sheet|\bbuy\b|purchase|place (an|the|my) order|want to order/i,
  urgent: /urgent|asap|immediately|this week|tomorrow|line (is )?down|stopped production/i,
  greeting: /^\s*(hi|hello|hey|good (morning|afternoon|evening)|salam|as-?salam|assalam|marhaba)\b|السلام|مرحبا|أهلا|اهلا/i,
}

function detectProducts(text) {
  return PRODUCT_MATCHERS.map(({ product, name, keywords }) => ({
    product,
    score: (name.test(text) ? 3 : 0) + keywords.filter((re) => re.test(text)).length,
  }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((m) => m.product.id)
}

function detectVolume(text) {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(k?g|t|tons?|tonnes?|mt)\b(?:\s*(?:\/|per|a|each)\s*(year|yr|annum|month|mo))?/i)
  if (!match) return ''
  let tons = parseFloat(match[1].replace(',', '.'))
  const unit = match[2].toLowerCase()
  if (unit === 'kg' || unit === 'g') tons = unit === 'kg' ? tons / 1000 : tons / 1e6
  if (/^mo/i.test(match[3] ?? '')) tons *= 12
  if (tons < 5) return 'lt5'
  if (tons < 25) return '5-25'
  if (tons < 100) return '25-100'
  if (tons <= 500) return '100-500'
  return 'gt500'
}

function detectTimeline(text) {
  if (INTENT.urgent.test(text) || /next week/i.test(text)) return 'urgent'
  if (/this month|within (a|one) month|few weeks/i.test(text)) return 'month'
  if (/quarter|next month|\b[23] months/i.test(text)) return 'quarter'
  if (/planning|budget|next year|exploring/i.test(text)) return 'planning'
  return ''
}

const firstMatch = (patterns, text) => patterns.filter(([, re]) => re.test(text)).map(([id]) => id)

function productBrief(product) {
  const dosageLine = product.knowledge.find((line) => /dosage|dosing|let-down|used at/i.test(line))
  const lines = [product.knowledge[0], dosageLine, product.knowledge.find((l) => l !== product.knowledge[0] && l !== dosageLine)]
    .filter(Boolean)
    .slice(0, 3)
  return `**${product.name}** — ${product.tagline}\n${lines.map((l) => `- ${l}`).join('\n')}`
}

export function createOfflineEngine() {
  let memory
  const reset = () => {
    memory = { productIds: [], polymers: [], process: '', annualVolume: '', timeline: '', formOpened: false, briefed: new Set() }
  }
  reset()

  const describeMemory = () =>
    [
      memory.productIds.map((id) => PRODUCT_BY_ID[id].name).join(' + '),
      memory.polymers.map((id) => labelOf(POLYMERS, id)).join('/'),
      memory.process && labelOf(PROCESSES, memory.process),
      memory.annualVolume && labelOf(ANNUAL_VOLUMES, memory.annualVolume),
    ]
      .filter(Boolean)
      .join(' · ')

  const handoff = (reason, userText, language, lead) => {
    const context = describeMemory()
    const message =
      language === 'ar'
        ? `مرحباً فريق مبيعات Pure Polymers، ${context ? `استفساري: ${context}. ` : ''}${userText}`.slice(0, 600)
        : `Hello Pure Polymers sales team. ${context ? `Context: ${context}. ` : ''}My request: ${userText}`.slice(0, 600)
    const reply =
      language === 'ar'
        ? `${lead ? `${lead}\n\n` : ''}سأوصلك مباشرة بفريق المبيعات في مدن 3 عبر واتساب — رسالتك جاهزة مع ملخص طلبك.`
        : `${lead ? `${lead}\n\n` : ''}This is best handled by our sales engineers directly. I've prepared a WhatsApp message with your context so you don't have to repeat yourself.`
    return {
      reply,
      actions: [
        {
          id: `offline-${Date.now()}`,
          type: TOOL.HANDOFF_TO_WHATSAPP,
          input: { reason, urgency: INTENT.urgent.test(userText) ? 'high' : 'normal', summary_for_sales: message, language },
        },
      ],
    }
  }

  const openForm = (language) => {
    memory.formOpened = true
    const missing = [
      !memory.polymers.length && 'base polymer',
      !memory.process && 'process',
      !memory.annualVolume && 'annual volume',
    ].filter(Boolean)
    const reply =
      language === 'ar'
        ? 'جهّزت لك نموذج طلب عرض السعر بالمعلومات التي ذكرتها. راجعه وأرسله — ستحصل فوراً على رقم مرجعي والنشرة الفنية (TDS) على بريدك.'
        : `I've opened the quote form and filled in what you told me${describeMemory() ? ` (${describeMemory()})` : ''}.${
            missing.length ? ` Just add the ${missing.join(' and ')}.` : ''
          } Submit it and you'll get a reference number on screen and the TDS by email right away.`
    return {
      reply,
      actions: [
        {
          id: `offline-${Date.now()}`,
          type: TOOL.OPEN_QUOTE_FORM,
          input: {
            product_ids: memory.productIds,
            base_polymers: memory.polymers,
            process: memory.process || 'unknown',
            end_market: 'unknown',
            annual_volume: memory.annualVolume || 'unknown',
            timeline: memory.timeline || 'unknown',
            sample_requested: true,
            technical_notes: 'Prefilled from the website assistant conversation.',
            qualification_summary: describeMemory(),
          },
        },
      ],
    }
  }

  function respond(rawText, { language: preferred = 'en' } = {}) {
    const text = rawText.trim()
    const language = ARABIC.test(text) ? 'ar' : preferred

    const productIds = detectProducts(text)
    const polymers = firstMatch(POLYMER_PATTERNS, text)
    const [process] = firstMatch(PROCESS_PATTERNS, text)
    memory.productIds = [...new Set([...productIds, ...memory.productIds])].slice(0, 5)
    memory.polymers = [...new Set([...memory.polymers, ...polymers])]
    memory.process = process || memory.process
    memory.annualVolume = detectVolume(text) || memory.annualVolume
    memory.timeline = detectTimeline(text) || memory.timeline

    if (INTENT.human.test(text)) return handoff('user_requested', text, language)
    if (INTENT.account.test(text)) return handoff('existing_order_or_complaint', text, language)
    if (INTENT.commercial.test(text)) return handoff('commercial_negotiation', text, language)
    if (INTENT.regulatory.test(text) || INTENT.custom.test(text)) {
      const note = 'Certification, compliance and custom-formulation questions need a signed answer from the technical team rather than a chat reply.'
      const fresh = productIds[0] && !memory.briefed.has(productIds[0])
      if (fresh) memory.briefed.add(productIds[0])
      const lead = fresh ? `${productBrief(PRODUCT_BY_ID[productIds[0]])}\n\n${note}` : note
      return handoff(INTENT.regulatory.test(text) ? 'regulatory_compliance' : 'complex_technical', text, language, lead)
    }

    const qualified = memory.productIds.length > 0 && (memory.polymers.length > 0 || memory.process) && (memory.annualVolume || memory.timeline)
    if (INTENT.quote.test(text) && memory.productIds.length) return openForm(language)
    if (qualified && !memory.formOpened) return openForm(language)

    if (productIds.length) {
      const top = PRODUCT_BY_ID[productIds[0]]
      memory.briefed.add(top.id)
      const cards = {
        id: `offline-${Date.now()}`,
        type: TOOL.SHOW_PRODUCT_CARDS,
        input: { product_ids: productIds.slice(0, 3), headline: 'From the Pure Polymers catalog' },
      }
      if (language === 'ar') {
        return {
          reply: `المنتج الأنسب لطلبك هو **${top.name}**. هذه البيانات الفنية من كتالوج Pure Polymers. ما هو البوليمر وطريقة التصنيع لديك (مثلاً LLDPE نفخ أفلام)؟`,
          actions: [cards],
        }
      }
      let question = ''
      if (!memory.polymers.length && !memory.process) {
        question = 'Which polymer and process are you running — for example LLDPE blown film or PP injection molding?'
      } else if (!memory.annualVolume) {
        question = 'Roughly what volume per year are you planning? With that I can set up your quote request.'
      } else {
        question = 'Want me to prefill the quote form with this?'
      }
      const slipNote = top.id === 'slip' ? '\n\nQuick check: do you need **lower** friction (slip) or **higher** friction (true anti-slip for stacked sacks)?' : ''
      return { reply: `${productBrief(top)}${slipNote}\n\n${question}`, actions: [cards] }
    }

    if (INTENT.quote.test(text)) {
      return {
        reply: 'Happy to get you a quotation. Which product do you need — color, white or black masterbatch, a functional additive, or a compound? If you describe the problem you are solving, I can recommend the right grade.',
        actions: [],
      }
    }

    if (INTENT.greeting.test(text) || language === 'ar') {
      return language === 'ar'
        ? {
            reply: 'أهلاً بك في Pure Polymers — مصنع الماستر باتش والمركبات في مدن 3، جدة. أخبرني عن منتجك أو المشكلة التي تواجهها في خط الإنتاج وسأقترح الحل المناسب وأجهّز طلب عرض السعر.',
            actions: [],
          }
        : {
            reply: `Hello! I'm the Pure Polymers technical assistant. We manufacture color, white, black and additive masterbatch in ${COMPANY.location}. Tell me what you're producing or the defect you're fighting — I'll recommend a grade and set up your quote.`,
            actions: [],
          }
    }

    return {
      reply:
        "I can help with product selection, dosage and processing questions across our 22 masterbatch lines — for example moisture defects in recycled film, anti-fog for greenhouse film, or high-TiO₂ white for injection molding. What are you producing, and on which polymer and process?",
      actions: [],
    }
  }

  return { respond, reset }
}
