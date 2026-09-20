import { CONFIG } from '../../config.js'
import { uuid } from '../reference.js'
import { readJSON, writeJSON } from '../storage.js'
import { createOfflineEngine } from './offlineEngine.js'
import { normalizeAction, toolResultText } from './tools.js'

const HISTORY_KEY = 'pp.assistant.history.v1'

/**
 * Stateless-server chat session. The browser owns the conversation in OpenAI chat
 * format and posts it whole each turn, append-only, so the long system prefix stays
 * byte-identical and prompt caching keeps hitting.
 *
 * The assistant's tools are UI actions executed here in the page, so every
 * `tool_call` is answered with a `tool` message on the following turn.
 */
export function createAssistantSession() {
  const saved = readJSON(HISTORY_KEY, null, 'session')
  const state = {
    sessionId: saved?.sessionId ?? uuid(),
    messages: Array.isArray(saved?.messages) ? saved.messages : [],
  }
  const offline = createOfflineEngine()
  const mode = CONFIG.assistantUrl ? 'live' : 'offline'

  const persist = () => writeJSON(HISTORY_KEY, { sessionId: state.sessionId, messages: state.messages }, 'session')

  const pendingToolCalls = () => {
    const last = state.messages[state.messages.length - 1]
    if (!last || last.role !== 'assistant' || !Array.isArray(last.tool_calls)) return []
    return last.tool_calls
  }

  async function sendLive(text, language) {
    const acknowledgements = pendingToolCalls().map((call) => ({
      role: 'tool',
      tool_call_id: call.id,
      content: toolResultText(call.function?.name),
    }))
    const outgoing = [...state.messages, ...acknowledgements, { role: 'user', content: text }]

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), CONFIG.assistantTimeoutMs)
    try {
      const response = await fetch(CONFIG.assistantUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, language, messages: outgoing }),
        signal: controller.signal,
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data) throw new Error(`Assistant HTTP ${response.status}`)

      if (data.ok && data.assistantMessage) {
        state.messages = [...outgoing, data.assistantMessage]
        persist()
      }
      // On ok:false the unanswered user turn is dropped, so the next attempt stays valid.
      return {
        reply: data.reply ?? '',
        actions: (data.actions ?? []).map(normalizeAction).filter(Boolean),
        ok: Boolean(data.ok),
      }
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    mode,
    sessionId: state.sessionId,
    async send(text, { language = 'en' } = {}) {
      const local = () => {
        const result = offline.respond(text, { language })
        return { ...result, actions: result.actions.map(normalizeAction).filter(Boolean), ok: true }
      }
      if (mode === 'offline') {
        await new Promise((resolve) => setTimeout(resolve, 650 + Math.random() * 500))
        return local()
      }
      try {
        return await sendLive(text, language)
      } catch {
        // Network or backend failure: degrade to the offline engine rather than go silent.
        return { ...local(), degraded: true }
      }
    },
    reset() {
      state.messages = []
      state.sessionId = uuid()
      offline.reset()
      persist()
    },
  }
}
