import { buildSystemPrompt } from './systemPrompt.mjs'
import { TOOLS } from './tools.mjs'

/**
 * OpenAI Chat Completions settings for the website assistant.
 *
 * Provider note: the tool contract, the system prompt and the browser protocol are
 * provider-neutral by design. Only this file, the two assistant Code nodes and the
 * HTTP node's URL/credential change if the model provider changes.
 */
export const MODEL = 'gpt-5.4-mini'

export const API = {
  url: 'https://api.openai.com/v1/chat/completions',
  credentialType: 'openAiApi',
}

/** GPT-5 and o-series take max_completion_tokens and reject a custom temperature. */
export const usesLegacyParams = (model) => /^(gpt-4|gpt-3)/.test(model)

/** Canonical schemas wrapped as OpenAI function tools (strict mode). */
export function openAiTools() {
  return TOOLS.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      strict: true,
      parameters: tool.input_schema,
    },
  }))
}

export function buildRequestTemplate() {
  const request = {
    model: MODEL,
    parallel_tool_calls: true,
    tool_choice: 'auto',
    tools: openAiTools(),
    messages: [{ role: 'system', content: buildSystemPrompt() }],
  }
  if (usesLegacyParams(MODEL)) {
    // Short, factual sales answers; the knowledge base does the heavy lifting.
    request.temperature = 0.3
    request.max_tokens = 1200
  } else {
    request.max_completion_tokens = 1600
  }
  return request
}
