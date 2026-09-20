/**
 * Code node · "Guard & Build Request" (run once for all items)
 * In : Webhook body { sessionId, language, messages[] } — OpenAI chat format,
 *      owned by the browser and appended to, never rewritten.
 * Out: one item { blocked, reply?, actions?, request? }
 *
 * The transcript is validated, not repaired: a malformed history gets a
 * deterministic WhatsApp handoff instead of a silently "fixed" conversation.
 */

// @inject SYSTEM_PROMPT
// @inject TOOLS

const MODEL = '__MODEL__'
const LIMITS = { maxMessages: 90, maxUserTurns: 30, maxNewUserChars: 2000, maxHistoryChars: 220000 }
const TOOL_NAMES = TOOLS.map((t) => t.name)

const first = $input.first().json
const body = first && typeof first.body === 'object' && first.body !== null ? first.body : first
const sessionId = String((body && body.sessionId) || '').slice(0, 64)
const language = body && body.language === 'ar' ? 'ar' : 'en'
const messages = Array.isArray(body && body.messages) ? body.messages : []

const CLOSED = {
  en: 'I could not follow that conversation. Let me connect you with our sales engineers instead — they answer on WhatsApp during business hours.',
  ar: 'لم أتمكن من متابعة هذه المحادثة. سأوصلك بفريق المبيعات على واتساب خلال ساعات العمل.',
}
const CAP = {
  en: 'We have covered a lot here. To keep moving, either submit the quote form on this page or continue with our sales engineers on WhatsApp — they will have the full picture in one message.',
  ar: 'لقد تناولنا الكثير هنا. يمكنك إرسال نموذج طلب عرض السعر في هذه الصفحة أو متابعة الحديث مع فريق المبيعات على واتساب.',
}

function block(reply, reason) {
  return [
    {
      json: {
        blocked: true,
        ok: true,
        reply,
        actions: [
          {
            id: 'guard-' + Date.now(),
            type: 'handoff_to_whatsapp',
            input: {
              reason,
              urgency: 'normal',
              summary_for_sales:
                language === 'ar'
                  ? 'مرحباً فريق مبيعات Pure Polymers، أود متابعة استفساري من موقعكم.'
                  : 'Hello Pure Polymers sales team, I would like to continue the enquiry I started on your website.',
              language,
            },
          },
        ],
        sessionId,
      },
    },
  ]
}

if (!messages.length || messages.length > LIMITS.maxMessages) return block(CLOSED[language], 'outside_catalog')
if (messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') return block(CLOSED[language], 'outside_catalog')

let userTurns = 0
for (let i = 0; i < messages.length; i++) {
  const message = messages[i]
  if (!message || ['user', 'assistant', 'tool'].indexOf(message.role) === -1) return block(CLOSED[language], 'outside_catalog')

  if (message.role === 'user') {
    userTurns += 1
    if (typeof message.content !== 'string' || !message.content.trim()) return block(CLOSED[language], 'outside_catalog')
    // A user turn may only follow the start, an assistant turn, or a tool result.
    if (i > 0 && messages[i - 1].role === 'user') return block(CLOSED[language], 'outside_catalog')
  }

  if (message.role === 'tool') {
    if (typeof message.tool_call_id !== 'string' || typeof message.content !== 'string') return block(CLOSED[language], 'outside_catalog')
  }

  if (message.role === 'assistant') {
    const calls = Array.isArray(message.tool_calls) ? message.tool_calls : []
    const hasText = typeof message.content === 'string' && message.content.trim().length > 0
    if (!hasText && !calls.length) return block(CLOSED[language], 'outside_catalog')

    // Every tool_call must be answered by a tool message directly after this turn.
    const answered = []
    for (let j = i + 1; j < messages.length && messages[j].role === 'tool'; j++) answered.push(messages[j].tool_call_id)
    for (const call of calls) {
      if (!call || typeof call.id !== 'string' || !call.function || TOOL_NAMES.indexOf(call.function.name) === -1) {
        return block(CLOSED[language], 'outside_catalog')
      }
      if (answered.indexOf(call.id) === -1) return block(CLOSED[language], 'outside_catalog')
    }
  }
}

/* Fingerprint of the prompt that was actually deployed. Logged with every
 * conversation so a changed knowledge base is visible in the analytics tab -
 * and so a corrupted deploy is caught before a buyer talks to it. */
function promptFingerprint(text) {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  return text.length + '-' + h.toString(16)
}

const last = messages[messages.length - 1]
if (last.content.length > LIMITS.maxNewUserChars) return block(CLOSED[language], 'outside_catalog')
if (userTurns > LIMITS.maxUserTurns) return block(CAP[language], 'user_requested')
if (JSON.stringify(messages).length > LIMITS.maxHistoryChars) return block(CAP[language], 'user_requested')

return [
  {
    json: {
      blocked: false,
      sessionId,
      language,
      userTurns,
      lastText: last.content.slice(0, 500),
      promptFingerprint: promptFingerprint(SYSTEM_PROMPT),
      request: Object.assign(
        {
          model: MODEL,
          /**
           * Serial tool calls, deliberately. With parallel_tool_calls enabled the
           * GPT-5 family treats the tool call AS the whole answer and returns
           * content: null, so the buyer gets product cards and no explanation.
           * Turning it off makes the model write its answer and call one tool —
           * measured on gpt-5.4-mini and gpt-5.4, both of which returned null
           * content on every parallel-mode turn. The cost is that cards and the
           * quote form can no longer open in the same turn; the written answer
           * is worth more than saving the buyer one message.
           */
          parallel_tool_calls: false,
          tool_choice: 'auto',
          user: sessionId,
          tools: TOOLS.map((tool) => ({
            type: 'function',
            function: { name: tool.name, description: tool.description, strict: true, parameters: tool.input_schema },
          })),
          // System prompt first and unchanged every turn: OpenAI caches long shared prefixes automatically.
          messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(messages),
        },
        // GPT-5 / o-series take max_completion_tokens and reject a custom temperature.
        /^(gpt-4|gpt-3)/.test(MODEL) ? { temperature: 0.3, max_tokens: 1200 } : { max_completion_tokens: 1600 },
      ),
    },
  },
]
