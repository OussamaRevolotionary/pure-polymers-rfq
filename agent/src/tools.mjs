import { PRODUCTS } from '../../quote-portal/src/data/catalog.js'
import { ANNUAL_VOLUMES, MARKETS, POLYMERS, PROCESSES, TIMELINES } from '../../quote-portal/src/data/options.js'

const productIds = PRODUCTS.map((p) => p.id)
const ids = (list) => list.map((o) => o.id)

/**
 * Client-rendered UI tools. The website executes each call and acknowledges it
 * with a tool_result on the next user turn, so the n8n backend stays stateless.
 *
 * strict: true guarantees schema-valid input. Every property is required (use
 * "unknown" / [] for missing facts) because the UI prefills from these values.
 * Length limits live in descriptions: strict mode does not accept min/max keywords.
 */
export const TOOLS = [
  {
    name: 'show_product_cards',
    description:
      'Display verified catalog cards (name, tagline, three key facts and an "Add to quote" button) for the Pure Polymers products you are recommending. Call it in the same turn as your written answer whenever you recommend, compare or explain specific products. This tool renders cards only and never speaks for you: your message content must still carry the answer — what causes the problem, why this product solves it, and the next qualifying question. Calling it with empty content leaves the buyer with a wall of cards and no reasoning. The cards already list the numbers, so explain rather than re-list them. Maximum 3 products, best match first.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        product_ids: {
          type: 'array',
          description: 'One to three catalog product ids, best match first.',
          items: { type: 'string', enum: productIds },
        },
        headline: {
          type: 'string',
          description:
            'Label shown above the cards, at most 60 characters, in the same language as the reply you just wrote — English unless the buyer wrote in Arabic. Example: "Fixes moisture defects in recycled film".',
        },
      },
      required: ['product_ids', 'headline'],
      additionalProperties: false,
    },
  },
  {
    name: 'open_quote_form',
    description:
      'Open the quote configurator on this page, prefilled with what you learned, and bring the buyer to it. Call it as soon as the buyer is qualified (you know the product need AND the base polymer or process AND the volume or timeline), or immediately when they ask for a price, quotation, sample, TDS, MOQ or lead time and you know which product they need. Nothing is sent to Pure Polymers until the buyer reviews and presses submit. Always write your message content alongside the call: say that the form is prefilled, which facts are still missing, and that a reference number appears the moment they submit. Use "unknown" or an empty array for anything the buyer did not state; never guess.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        product_ids: {
          type: 'array',
          description: 'One to five catalog product ids for the inquiry. For a combination (e.g. white masterbatch plus slip), include each product.',
          items: { type: 'string', enum: productIds },
        },
        base_polymers: {
          type: 'array',
          description: 'Base polymers the buyer runs. Empty array if not stated.',
          items: { type: 'string', enum: ids(POLYMERS) },
        },
        process: { type: 'string', enum: [...ids(PROCESSES), 'unknown'], description: 'Conversion process, or "unknown".' },
        end_market: { type: 'string', enum: [...ids(MARKETS), 'unknown'], description: 'End market, or "unknown".' },
        annual_volume: {
          type: 'string',
          enum: ids(ANNUAL_VOLUMES),
          description:
            'Annual masterbatch volume bucket. Convert monthly figures to yearly (5 t/month = 60 t/yr = "25-100"). Use "unknown" if not stated.',
        },
        timeline: { type: 'string', enum: [...ids(TIMELINES), 'unknown'], description: 'Purchase timeline, or "unknown".' },
        sample_requested: {
          type: 'boolean',
          description: 'true unless the buyer said they do not need a lab sample first.',
        },
        technical_notes: {
          type: 'string',
          description:
            'Facts from the conversation the technical team needs: defects, film structure, thickness, dosage discussed, current grade, certifications mentioned. English, at most 400 characters. Empty string if none.',
        },
        qualification_summary: {
          type: 'string',
          description: 'One English sentence for the sales team, at most 200 characters.',
        },
      },
      required: [
        'product_ids',
        'base_polymers',
        'process',
        'end_market',
        'annual_volume',
        'timeline',
        'sample_requested',
        'technical_notes',
        'qualification_summary',
      ],
      additionalProperties: false,
    },
  },
  {
    name: 'handoff_to_whatsapp',
    description:
      'Show the buyer a button that opens WhatsApp with the Pure Polymers sales desk (+966 54 646 0891), prefilled with your summary so they never repeat themselves. Call it when: the buyer asks for a person, a call or WhatsApp; the question needs a certification or regulatory answer (FDA, EU 10/2011, REACH, SFDA, halal, UL 94 certificates, medical use, antimicrobial efficacy claims); custom formulation, failure analysis, a complaint, an existing order, delivery status or an invoice; price negotiation, distribution or payment terms; material needed in under 2 weeks; or you cannot answer from the catalog after one attempt. Always write your message content alongside the call: share whatever the catalog does confirm, then say in one sentence why the sales engineers take it from here. Never call it in the same turn as open_quote_form.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: [
            'user_requested',
            'regulatory_compliance',
            'complex_technical',
            'existing_order_or_complaint',
            'commercial_negotiation',
            'urgent_timeline',
            'outside_catalog',
          ],
          description: 'Why a human is needed.',
        },
        urgency: { type: 'string', enum: ['normal', 'high'], description: '"high" if production is stopped or delivery is needed within 2 weeks.' },
        summary_for_sales: {
          type: 'string',
          description:
            'The WhatsApp message the buyer will send, in the buyer\'s language and first person, at most 60 words: company if known, products, polymer and process, volume, and the exact question.',
        },
        language: { type: 'string', enum: ['en', 'ar'], description: 'Language of the conversation.' },
      },
      required: ['reason', 'urgency', 'summary_for_sales', 'language'],
      additionalProperties: false,
    },
  },
]

export const TOOL_NAMES = TOOLS.map((t) => t.name)
