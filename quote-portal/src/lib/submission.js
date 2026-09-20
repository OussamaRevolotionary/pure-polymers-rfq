import { CONFIG } from '../config.js'
import { readJSON, writeJSON } from './storage.js'

const OUTBOX_KEY = 'pp.rfq.outbox.v1'
const BACKOFF_MS = [0, 1500, 4000]
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function outbox() {
  const items = readJSON(OUTBOX_KEY, [])
  return Array.isArray(items) ? items : []
}

function saveToOutbox(payload) {
  const items = outbox().filter((item) => item.payload.submissionId !== payload.submissionId)
  items.push({ payload, savedAt: new Date().toISOString() })
  writeJSON(OUTBOX_KEY, items)
}

function removeFromOutbox(submissionId) {
  writeJSON(
    OUTBOX_KEY,
    outbox().filter((item) => item.payload.submissionId !== submissionId),
  )
}

class HttpError extends Error {
  constructor(status, body) {
    super(`HTTP ${status}`)
    this.status = status
    this.body = body
  }
}

const isRetryable = (error) =>
  !(error instanceof HttpError) || error.status === 408 || error.status === 429 || error.status >= 500

async function postOnce(payload) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CONFIG.submitTimeoutMs)
  try {
    const response = await fetch(CONFIG.quoteWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const text = await response.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = { raw: text }
    }
    if (!response.ok) throw new HttpError(response.status, body)
    return body
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Delivers a quote request with zero-drop semantics:
 *   1. persist to a local outbox before the first byte leaves the browser
 *   2. POST with timeout + backoff on network / 408 / 429 / 5xx
 *   3. clear the outbox only after the webhook acknowledges (2xx)
 * The server de-duplicates on `submissionId`, so retries are safe.
 *
 * Resolves to { status: 'delivered' | 'queued' | 'rejected' | 'preview', server? }.
 */
export async function submitQuote(payload) {
  if (!CONFIG.quoteWebhookUrl) {
    await sleep(1100)
    return { status: 'preview' }
  }

  saveToOutbox(payload)
  let lastError
  for (const delay of BACKOFF_MS) {
    if (delay) await sleep(delay)
    try {
      const server = await postOnce(payload)
      removeFromOutbox(payload.submissionId)
      return { status: 'delivered', server }
    } catch (error) {
      lastError = error
      if (!isRetryable(error)) break
    }
  }

  if (lastError instanceof HttpError && !isRetryable(lastError)) {
    removeFromOutbox(payload.submissionId)
    return { status: 'rejected', server: lastError.body }
  }
  return { status: 'queued' }
}

/** Re-sends anything left in the outbox (called on load and when the browser comes back online). */
export async function flushOutbox() {
  if (!CONFIG.quoteWebhookUrl || typeof navigator !== 'undefined' && navigator.onLine === false) return 0
  let delivered = 0
  for (const item of outbox()) {
    try {
      await postOnce(item.payload)
      removeFromOutbox(item.payload.submissionId)
      delivered += 1
    } catch (error) {
      if (!isRetryable(error)) removeFromOutbox(item.payload.submissionId)
    }
  }
  return delivered
}

export function pendingOutboxCount() {
  return outbox().length
}
