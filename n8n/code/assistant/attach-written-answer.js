/**
 * Code node · "Attach Written Answer" (run once for all items)
 * In : the second completion — same cached prefix, tools disabled, so the model
 *      could only write prose about the tool call it already made
 * Out: the Shape Reply item with that prose merged in
 *
 * Never fatal: if the second call failed, the canned line Shape Reply already
 * wrote stays, so the buyer always gets a sentence with their cards.
 */

const shaped = $('Shape Reply').first().json
const response = $input.first().json
const status = Number(response.statusCode || 0)
const payload = response.body && typeof response.body === 'object' ? response.body : {}
const choice = status === 200 && Array.isArray(payload.choices) ? payload.choices[0] : null
const message = (choice && choice.message) || null
const text = message && typeof message.content === 'string' ? message.content.trim() : ''

const out = Object.assign({}, shaped)
// The follow-up request carries the whole system prompt; it must not travel further.
delete out.writtenAnswerRequest
delete out.needsWrittenAnswer

if (text) {
  const usage = payload.usage || {}
  out.reply = text
  out.assistantMessage = Object.assign({}, shaped.assistantMessage, { content: text })
  out.meta = Object.assign({}, shaped.meta || {}, {
    writtenAnswerAttempted: true,
    writtenAnswerTokens: usage.completion_tokens || 0,
    writtenAnswerCachedPromptTokens: (usage.prompt_tokens_details && usage.prompt_tokens_details.cached_tokens) || 0,
  })
} else {
  out.meta = Object.assign({}, shaped.meta || {}, { writtenAnswerAttempted: true, writtenAnswerTokens: 0 })
}

return [{ json: out }]
