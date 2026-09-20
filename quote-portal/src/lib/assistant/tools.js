import { PRODUCT_BY_ID } from '../../data/catalog.js'
import { ANNUAL_VOLUMES, MARKETS, POLYMERS, PROCESSES, TIMELINES } from '../../data/options.js'

/**
 * Client side of the agent's tool contract. All three tools are UI actions:
 * the browser executes them and acknowledges each tool_use with a tool_result
 * on the next user turn (see session.js). Schemas live in agent/src/tools.mjs.
 */
export const TOOL = {
  SHOW_PRODUCT_CARDS: 'show_product_cards',
  OPEN_QUOTE_FORM: 'open_quote_form',
  HANDOFF_TO_WHATSAPP: 'handoff_to_whatsapp',
}

const known = (list, id) => (id && id !== 'unknown' && list.some((o) => o.id === id) ? id : '')

/** Validates and narrows model-produced input before it touches app state. */
export function normalizeAction(action) {
  const input = action?.input ?? {}
  switch (action?.type) {
    case TOOL.SHOW_PRODUCT_CARDS: {
      const productIds = (input.product_ids ?? []).filter((id) => PRODUCT_BY_ID[id]).slice(0, 4)
      return productIds.length ? { ...action, input: { productIds, headline: String(input.headline ?? '').slice(0, 140) } } : null
    }
    case TOOL.OPEN_QUOTE_FORM: {
      return {
        ...action,
        input: {
          productIds: (input.product_ids ?? []).filter((id) => PRODUCT_BY_ID[id]).slice(0, 5),
          polymers: (input.base_polymers ?? []).filter((id) => POLYMERS.some((p) => p.id === id)),
          process: known(PROCESSES, input.process),
          market: known(MARKETS, input.end_market),
          annualVolume: known(ANNUAL_VOLUMES, input.annual_volume),
          timeline: known(TIMELINES, input.timeline),
          sampleRequested: typeof input.sample_requested === 'boolean' ? input.sample_requested : undefined,
          notes: String(input.technical_notes ?? '').slice(0, 800),
          summary: String(input.qualification_summary ?? '').slice(0, 300),
        },
      }
    }
    case TOOL.HANDOFF_TO_WHATSAPP:
      return {
        ...action,
        input: {
          reason: String(input.reason ?? 'user_requested'),
          urgency: input.urgency === 'high' ? 'high' : 'normal',
          message: String(input.summary_for_sales ?? '').slice(0, 700),
          language: input.language === 'ar' ? 'ar' : 'en',
        },
      }
    default:
      return null
  }
}

export function toolResultText(name) {
  switch (name) {
    case TOOL.SHOW_PRODUCT_CARDS:
      return 'Product cards with verified catalog data were displayed to the user.'
    case TOOL.OPEN_QUOTE_FORM:
      return 'The quote configurator was opened and prefilled on the page. The user is reviewing it; nothing is submitted until they press submit.'
    case TOOL.HANDOFF_TO_WHATSAPP:
      return 'A button to continue on WhatsApp with the Pure Polymers sales desk (+966 54 646 0891) was displayed with your summary prefilled. The user may or may not tap it.'
    default:
      return 'This action is not available in the website interface, so nothing was shown to the user.'
  }
}
