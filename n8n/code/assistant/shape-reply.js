/**
 * Code node · "Shape Reply" / "Shape Reply (final)" (run once for all items)
 * In : HTTP Request output with fullResponse + neverError → { statusCode, body }
 * Out: one item — either the response for the browser, or a retry instruction.
 *
 * ATTEMPT is set by the build script (1 for the first call, 2 for the retry), so
 * the second pass can never ask for another retry.
 */

const ATTEMPT = __ATTEMPT__

const RETRY_STATUS = [408, 409, 425, 429, 500, 502, 503, 504, 529]
const ALLOWED_TOOLS = ['show_product_cards', 'open_quote_form', 'handoff_to_whatsapp']
const FALLBACK = {
  en: 'I am having trouble reaching our technical knowledge base right now. You can still submit the quote form on this page — it works independently — or message our sales engineers on WhatsApp.',
  ar: 'أواجه صعوبة في الوصول إلى قاعدة المعرفة الفنية حالياً. يمكنك إرسال نموذج طلب عرض السعر في هذه الصفحة أو التواصل مع فريق المبيعات على واتساب.',
}

const guard = $('Guard & Build Request').first().json
const language = guard.language === 'ar' ? 'ar' : 'en'
const response = $input.first().json
const status = Number(response.statusCode || 0)
const payload = response.body && typeof response.body === 'object' ? response.body : {}

function handoff(reason) {
  return [
    {
      id: 'backend-' + Date.now(),
      type: 'handoff_to_whatsapp',
      input: {
        reason,
        urgency: 'normal',
        summary_for_sales:
          language === 'ar'
            ? 'مرحباً فريق مبيعات Pure Polymers، بدأت استفساراً على موقعكم وأود متابعته معكم.'
            : 'Hello Pure Polymers sales team, I started an enquiry on your website and would like to continue it with you.',
        language,
      },
    },
  ]
}

function fail(reason, meta) {
  return [{ json: Object.assign({ retry: false, ok: false, reply: FALLBACK[language], actions: handoff(reason), sessionId: guard.sessionId }, meta || {}) }]
}

if (status !== 200) {
  if (ATTEMPT === 1 && RETRY_STATUS.indexOf(status) !== -1) {
    return [{ json: { retry: true, status, sessionId: guard.sessionId } }]
  }
  return fail('outside_catalog', { status, error: (payload.error && payload.error.message) || '' })
}

const choice = Array.isArray(payload.choices) ? payload.choices[0] : null
const message = (choice && choice.message) || null
if (!message) return fail('outside_catalog', { stopReason: 'empty' })

// A truncated answer is worse than none: retry once, then hand off.
if (choice.finish_reason === 'length') {
  if (ATTEMPT === 1) return [{ json: { retry: true, status, sessionId: guard.sessionId } }]
  return fail('outside_catalog', { stopReason: 'length' })
}
if (choice.finish_reason === 'content_filter') return fail('outside_catalog', { stopReason: 'content_filter' })

const rawCalls = Array.isArray(message.tool_calls) ? message.tool_calls : []
const actions = []
const keptCalls = []
for (const call of rawCalls) {
  const name = call && call.function && call.function.name
  if (ALLOWED_TOOLS.indexOf(name) === -1) continue
  let input = {}
  try {
    input = JSON.parse((call.function && call.function.arguments) || '{}')
  } catch (error) {
    continue // malformed arguments: drop the action rather than prefill nonsense
  }
  actions.push({ id: call.id, type: name, input })
  keptCalls.push(call)
}

let reply = typeof message.content === 'string' ? message.content.trim() : ''

/* The GPT-5 family often treats a tool call AS the whole answer and returns no
 * content, which would leave the buyer looking at product cards with nothing
 * explaining them. When that happens we ask for the missing prose in a second
 * call: same cached prefix, tools disabled, so it can only write. The canned
 * lines below stay as the last resort if that call also fails. */
const needsWrittenAnswer = !reply && actions.length > 0 && ATTEMPT === 1
let writtenAnswerRequest = null
if (needsWrittenAnswer) {
  const base = guard.request
  const acknowledgements = keptCalls.map((call) => ({
    role: 'tool',
    tool_call_id: call.id,
    content: 'The page displayed this to the buyer. Now write the reply that goes with it.',
  }))
  writtenAnswerRequest = Object.assign({}, base, {
    messages: base.messages.concat([{ role: 'assistant', content: null, tool_calls: keptCalls }], acknowledgements),
    tool_choice: 'none',
    max_completion_tokens: 700,
  })
}

if (!reply) {
  const action = actions[0]
  if (action && action.type === 'open_quote_form') {
    reply =
      language === 'ar'
        ? 'جهّزت نموذج طلب عرض السعر بالمعلومات التي ذكرتها — راجعه وأرسله وستحصل على رقم مرجعي فوراً.'
        : "I've prefilled the quote form with what you told me — review it and submit to get your reference number and TDS."
  } else if (action && action.type === 'handoff_to_whatsapp') {
    reply =
      language === 'ar'
        ? 'سأوصلك بفريق المبيعات على واتساب مع ملخص استفسارك.'
        : 'Let me connect you with our sales engineers on WhatsApp, with a summary of your enquiry attached.'
  } else if (action && action.type === 'show_product_cards') {
    reply = language === 'ar' ? 'إليك المنتجات المناسبة من كتالوج Pure Polymers.' : 'Here are the products from our catalog that fit.'
  } else {
    return fail('outside_catalog', { stopReason: 'empty_message' })
  }
}

/* The exact assistant message the browser must append (dropped tool calls excluded,
   so every stored tool_call still gets a matching tool result next turn). */
const assistantMessage = { role: 'assistant', content: reply }
if (keptCalls.length) assistantMessage.tool_calls = keptCalls

const usage = payload.usage || {}
const cached = (usage.prompt_tokens_details && usage.prompt_tokens_details.cached_tokens) || 0
const logged = actions.filter((a) => a.type === 'open_quote_form' || a.type === 'handoff_to_whatsapp')

return [
  {
    json: {
      retry: false,
      ok: true,
      needsWrittenAnswer,
      writtenAnswerRequest,
      reply,
      actions,
      assistantMessage,
      sessionId: guard.sessionId,
      shouldLog: logged.length > 0,
      logEvent: logged.length
        ? {
            event: logged[0].type,
            reason: logged[0].input.reason || '',
            urgency: logged[0].input.urgency || '',
            products: (logged[0].input.product_ids || []).join(','),
            polymers: (logged[0].input.base_polymers || []).join(','),
            process: logged[0].input.process || '',
            volume: logged[0].input.annual_volume || '',
            timeline: logged[0].input.timeline || '',
            summary: logged[0].input.qualification_summary || logged[0].input.summary_for_sales || '',
          }
        : null,
      meta: {
        model: payload.model || '',
        finishReason: choice.finish_reason || '',
        attempt: ATTEMPT,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        cachedPromptTokens: cached,
      },
    },
  },
]
