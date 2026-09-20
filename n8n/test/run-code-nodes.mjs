/**
 * Runs every Code node against realistic fixtures.
 *
 *   node n8n/test/run-code-nodes.mjs
 *
 * The quote fixture is produced by the FRONTEND's own buildPayload(), so the
 * browser and the workflow can never drift apart silently. Rendered emails are
 * written to n8n/previews for eyeballing in a browser.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPayload } from '../../quote-portal/src/lib/payload.js'
import { initialQuoteState, quoteReducer } from '../../quote-portal/src/state/quoteState.js'
import { MODEL } from '../../agent/src/request.mjs'
import { loadCode } from '../lib/load-code.mjs'
import { assert, runCodeNode, section } from './harness.mjs'

const previews = join(dirname(fileURLToPath(import.meta.url)), '..', 'previews')
mkdirSync(previews, { recursive: true })

/* ───── fixture: a buyer configures desiccant + anti-fog exactly as the UI would ───── */
const steps = [
  { type: 'selectFamily', familyId: 'additive' },
  { type: 'toggleProduct', productId: 'desiccant' },
  { type: 'toggleProduct', productId: 'antifog' },
  { type: 'setSpec', productId: 'desiccant', fieldId: 'moistureSource', value: ['Recycled / regrind', 'Humid storage'] },
  { type: 'setSpec', productId: 'desiccant', fieldId: 'defects', value: ['Fish-eyes / lensing', 'Film bubble breakage'] },
  { type: 'setSpec', productId: 'desiccant', fieldId: 'drying', value: 'No drying today' },
  { type: 'setSpec', productId: 'desiccant', fieldId: 'recycledPct', value: '30–70%' },
  { type: 'setSpec', productId: 'antifog', fieldId: 'structure', value: 'Multi-layer (skin layer)' },
  { type: 'setSpec', productId: 'antifog', fieldId: 'fogType', value: ['Cold fog'] },
  { type: 'setSpec', productId: 'antifog', fieldId: 'use', value: 'Food packaging' },
  { type: 'setApplication', patch: { polymers: ['lldpe', 'rpe'], process: 'blown-film', market: 'flexible-packaging', finalProduct: '40 µm lidding film for fresh produce' } },
  {
    type: 'setCommercial',
    patch: { annualVolume: '25-100', firstOrder: 'trial', timeline: 'urgent', sampleRequested: true, country: 'Saudi Arabia', city: 'Riyadh 2nd Industrial City', benchmark: 'Imported desiccant MB' },
  },
  {
    type: 'setContact',
    patch: {
      firstName: 'Fahad',
      lastName: 'Alnanih',
      email: 'buyer@demo-packaging.com',
      dialCode: '+966',
      phone: '54 646 0891',
      whatsappOptIn: true,
      company: 'Demo Packaging Co.',
      role: 'production',
      channel: 'whatsapp',
      language: 'en',
      notes: '3-layer blown film, 2,000 mm die. Fish-eyes appeared after we went to 40% regrind.',
      consent: true,
    },
  },
]
const state = steps.reduce(quoteReducer, initialQuoteState)
const payload = buildPayload(state, {
  reference: 'PP-8942-AM',
  submissionId: '2f5c2b40-1f2a-4f0e-9e4f-d1a0a1d4f001',
  submittedAt: new Date().toISOString(),
})

let failures = 0
const run = async (title, fn) => {
  section(title)
  try {
    await fn()
  } catch (error) {
    failures += 1
    process.stdout.write('  ✖ ' + error.message + '\n')
  }
}

/* ─────────────────────────────── B · quote intake ─────────────────────────────── */

let validated
await run('Validate & Normalize', async () => {
  const out = await runCodeNode(loadCode('quote/validate-normalize.js'), { input: [{ json: { body: payload } }] })
  validated = out[0].json
  assert(validated.valid === true, 'accepts a payload built by the frontend')
  assert(validated.spam === false && validated.httpStatus === 200, 'honeypot clear, HTTP 200')
  assert(validated.lead.route === 'additive' && validated.lead.team === 'Additives Technical Desk', 'routes additives to the technical desk')
  assert(validated.lead.tier === 'HOT' && validated.lead.score >= 65, `scores the lead (${validated.lead.score}/100 → ${validated.lead.tier})`)
  assert(Date.parse(validated.lead.slaDueIso) > Date.now(), `SLA due in the future (${validated.lead.slaDueLocal})`)
  assert(Object.keys(validated.row).length === 37, '37 sheet columns are flattened')
  assert(validated.row.specs.includes('Fish-eyes / lensing'), 'spec answers survive into the sheet row')
  assert(validated.lead.contact.businessEmail === true, 'company domain recognised')

  const spam = await runCodeNode(loadCode('quote/validate-normalize.js'), {
    input: [{ json: { body: { ...payload, hp: 'http://spam.example' } } }],
  })
  assert(spam[0].json.valid === false && spam[0].json.spam === true && spam[0].json.httpStatus === 200, 'honeypot submissions are dropped with a 200')

  const bad = await runCodeNode(loadCode('quote/validate-normalize.js'), {
    input: [{ json: { body: { ...payload, contact: { ...payload.contact, email: 'not-an-email' }, consent: { contact: false } } } }],
  })
  assert(bad[0].json.valid === false && bad[0].json.httpStatus === 422, 'invalid email + missing consent → 422')
  assert(bad[0].json.errors.length === 2, 'both problems are reported back')

  const weak = await runCodeNode(loadCode('quote/validate-normalize.js'), {
    input: [
      {
        json: {
          body: {
            ...payload,
            commercial: { ...payload.commercial, annualVolume: { id: 'lt5', label: '< 5 t / yr' }, timeline: { id: 'planning', label: 'Planning / budgeting' } },
            contact: { ...payload.contact, email: 'someone@gmail.com' },
          },
        },
      },
    ],
  })
  assert(weak[0].json.lead.tier === 'NURTURE', `small volume + free mailbox → NURTURE (${weak[0].json.lead.score}/100)`)
})

const routeNode = {
  json: {
    route_team: 'Additives Technical Desk',
    route_variant: 'additive',
    route_recipients: 'technical@purepolymers.net',
    route_cc: 'info@purepolymers.net',
    route_focus: 'Confirm dosage for the stated polymer and process, and flag any grade not documented for that polymer.',
  },
}

await run('Compose Sales Alert', async () => {
  const out = await runCodeNode(loadCode('quote/compose-sales-alert.js'), {
    input: [routeNode],
    nodes: {
      'Validate & Normalize': { json: validated },
      'Route · Additives Desk': routeNode,
      'Route · Color Lab': { json: {}, isExecuted: false },
      'Route · Compounding Team': { json: {}, isExecuted: false },
      'Route · Sales Triage': { json: {}, isExecuted: false },
    },
  })
  const alert = out[0].json
  // Demo mode deliberately sends the sales alert to Fahad so he feels the notification
  // his desk would get. We stay on the bcc line: visible to us, invisible on his copy.
  assert(alert.to === 'fahad@purepolymers.net', 'demo mode alerts the client directly')
  assert(alert.bcc === 'oussama.g@oussamalabs.com', 'and bccs us so we know when he tries it')
  assert(alert.cc === '', 'no cc in demo mode — his copy shows only his own address')
  assert(alert.subject.startsWith('🔥 HOT · PP-8942-AM'), 'subject leads with tier and reference')
  assert(alert.html.includes('Additives Technical Desk') && alert.html.includes('quotation due'), 'alert names the desk and the SLA')
  assert(alert.html.includes('wa.me/966546460891'), "one-tap WhatsApp to the buyer's number")
  assert(alert.html.includes('Fish-eyes / lensing'), 'full technical spec is in the alert')
  writeFileSync(join(previews, 'sales-alert.html'), alert.html)
})

let resolved
await run('Resolve TDS Files', async () => {
  const library = [
    { json: { product_id: 'desiccant', product_name: 'Desiccant Masterbatch', tds_file_id: '1AbCdesiccant', tds_file_name: 'TDS-DES01.pdf', version: 'v3' } },
    { json: { product_id: 'uv-stabilizer', tds_file_id: '1AbCuv', tds_file_name: 'TDS-UV.pdf' } },
  ]
  const out = await runCodeNode(loadCode('quote/resolve-tds.js'), { input: library, nodes: { 'Validate & Normalize': { json: validated } } })
  resolved = out[0].json
  assert(out.length === 1, 'always emits exactly one item')
  assert(resolved.hasTds === true && resolved.tdsFiles.length === 1, 'matches the desiccant data sheet')
  assert(resolved.missing.includes('Anti-Fog Masterbatch'), 'reports the product with no TDS on file')

  const empty = await runCodeNode(loadCode('quote/resolve-tds.js'), { input: [{ json: {} }], nodes: { 'Validate & Normalize': { json: validated } } })
  assert(empty[0].json.hasTds === false, 'empty library still produces an item (buyer email never blocked)')
})

await run('Bundle TDS & Compose Buyer Email', async () => {
  const withTds = await runCodeNode(loadCode('quote/compose-buyer-email.js'), {
    input: [{ json: { id: '1AbCdesiccant' }, binary: { data: { fileName: 'TDS-DES01.pdf', mimeType: 'application/pdf', id: 'filesystem-v2:xyz' } } }],
    nodes: { 'Validate & Normalize': { json: validated }, 'Resolve TDS Files': { json: resolved }, 'Route · Additives Desk': routeNode },
  })
  const mail = withTds[0].json
  assert(mail.to === 'buyer@demo-packaging.com', 'buyer confirmation always goes to the buyer')
  assert(mail.attachmentProps === 'tds_0' && withTds[0].binary.tds_0.fileName === 'TDS-DES01.pdf', 'TDS binary is bundled for Gmail')
  assert(mail.subject.includes('PP-8942-AM'), 'reference is in the subject line')
  assert(mail.html.includes('PP-8942-AM') && mail.html.includes('Formal quotation'), 'reference + dated promise in the body')
  assert(mail.html.includes('colorsvisualizer.com') && mail.html.includes('5%'), 'Colors Visualizer offer carries the reference')
  assert(mail.html.includes('Additives Technical Desk'), 'buyer is told which desk owns it')
  writeFileSync(join(previews, 'buyer-confirmation.html'), mail.html)

  const noTds = await runCodeNode(loadCode('quote/compose-buyer-email.js'), {
    input: [{ json: { hasTds: false, tdsFiles: [], missing: ['Desiccant Masterbatch'] } }],
    nodes: {
      'Validate & Normalize': { json: validated },
      'Resolve TDS Files': { json: { hasTds: false, tdsFiles: [], missing: ['Desiccant Masterbatch'] } },
      'Route · Additives Desk': routeNode,
    },
  })
  assert(noTds[0].json.hasAttachments === false, 'no-TDS path still composes an email')
  assert(noTds[0].json.html.includes('technical data sheet follows'), 'and promises the data sheet explicitly')
  writeFileSync(join(previews, 'buyer-confirmation-no-tds.html'), noTds[0].json.html)
})

/* ─────────────────────────────── A · assistant ─────────────────────────────── */

const guardSource = loadCode('assistant/guard-build-request.js', { __MODEL__: MODEL })
let guardOut

await run('Guard & Build Request', async () => {
  const out = await runCodeNode(guardSource, {
    input: [{ json: { body: { sessionId: 'ba0d1c00-0000-4000-8000-000000000001', language: 'en', messages: [{ role: 'user', content: 'Fish-eyes in recycled LLDPE film — what fixes it?' }] } } }],
  })
  guardOut = out[0].json
  assert(guardOut.blocked === false, 'accepts a clean first turn')
  assert(guardOut.request.model === MODEL, `targets ${MODEL}`)
  assert(guardOut.request.messages[0].role === 'system', 'system prompt leads the request (stable cache prefix)')
  assert(guardOut.request.messages[0].content.includes('<knowledge_base>'), 'catalog knowledge base is embedded')
  assert(guardOut.request.tools.length === 3 && guardOut.request.tools[0].type === 'function', 'three tools in OpenAI function format')
  assert(guardOut.request.tools.every((t) => t.function.strict === true && t.function.parameters.additionalProperties === false), 'strict schemas so tool arguments always parse')
  assert(guardOut.request.user === 'ba0d1c00-0000-4000-8000-000000000001', 'session id travels as the abuse-signal user field')

  const toolTurn = await runCodeNode(guardSource, {
    input: [
      {
        json: {
          body: {
            sessionId: 'ba0d1c00-0000-4000-8000-000000000001',
            language: 'en',
            messages: [
              { role: 'user', content: 'Fish-eyes in recycled LLDPE film?' },
              {
                role: 'assistant',
                content: 'Moisture from the regrind.',
                tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'show_product_cards', arguments: '{"product_ids":["desiccant"],"headline":"Moisture defects"}' } }],
              },
              { role: 'tool', tool_call_id: 'call_1', content: 'Product cards were displayed.' },
              { role: 'user', content: 'LLDPE blown film, 5 t/month' },
            ],
          },
        },
      },
    ],
  })
  assert(toolTurn[0].json.blocked === false, 'accepts a replayed tool_call / tool result turn')
  assert(toolTurn[0].json.request.messages.length === 5, 'history is replayed unchanged under the system message')

  const unanswered = await runCodeNode(guardSource, {
    input: [
      {
        json: {
          body: {
            sessionId: 's',
            messages: [
              { role: 'user', content: 'hi' },
              { role: 'assistant', content: 'one moment', tool_calls: [{ id: 'call_9', type: 'function', function: { name: 'open_quote_form', arguments: '{}' } }] },
              { role: 'user', content: 'and now?' },
            ],
          },
        },
      },
    ],
  })
  assert(unanswered[0].json.blocked === true, 'rejects a history with an unanswered tool_call')
  assert(unanswered[0].json.actions[0].type === 'handoff_to_whatsapp', 'and degrades to a WhatsApp handoff rather than failing')

  const unknownTool = await runCodeNode(guardSource, {
    input: [
      {
        json: {
          body: {
            sessionId: 's',
            messages: [
              { role: 'user', content: 'hi' },
              { role: 'assistant', content: '', tool_calls: [{ id: 'call_x', type: 'function', function: { name: 'transfer_funds', arguments: '{}' } }] },
              { role: 'tool', tool_call_id: 'call_x', content: 'done' },
              { role: 'user', content: 'ok' },
            ],
          },
        },
      },
    ],
  })
  assert(unknownTool[0].json.blocked === true, 'rejects a tool name the page never exposes')

  const injected = await runCodeNode(guardSource, {
    input: [{ json: { body: { sessionId: 's', messages: [{ role: 'user', content: [{ type: 'image_url', image_url: {} }] }] } } }],
  })
  assert(injected[0].json.blocked === true, 'rejects content shapes the UI never sends')

  const tooLong = await runCodeNode(guardSource, {
    input: [{ json: { body: { sessionId: 's', messages: [{ role: 'user', content: 'x'.repeat(2500) }] } } }],
  })
  assert(tooLong[0].json.blocked === true, 'caps the size of a new user message')
})

await run('Shape Reply', async () => {
  const guardNode = { 'Guard & Build Request': { json: guardOut } }
  const shape = (attempt, body, status = 200) =>
    runCodeNode(loadCode('assistant/shape-reply.js', { __ATTEMPT__: String(attempt) }), {
      input: [{ json: { statusCode: status, body } }],
      nodes: guardNode,
    })

  const ok = await shape(1, {
    model: MODEL,
    choices: [
      {
        finish_reason: 'tool_calls',
        message: {
          role: 'assistant',
          content: 'That points to moisture in the regrind.',
          tool_calls: [
            {
              id: 'call_2',
              type: 'function',
              function: { name: 'open_quote_form', arguments: '{"product_ids":["desiccant"],"annual_volume":"25-100","qualification_summary":"Desiccant for LLDPE blown film"}' },
            },
          ],
        },
      },
    ],
    usage: { prompt_tokens: 11400, completion_tokens: 120, prompt_tokens_details: { cached_tokens: 10240 } },
  })
  const shaped = ok[0].json
  assert(shaped.ok === true && shaped.retry === false, 'passes a good response through')
  assert(shaped.actions[0].type === 'open_quote_form', 'surfaces the tool call as a UI action')
  assert(shaped.actions[0].input.product_ids[0] === 'desiccant', 'JSON string arguments are parsed for the UI')
  assert(shaped.assistantMessage.tool_calls.length === 1, 'returns the assistant message for the browser history')
  assert(shaped.shouldLog === true && shaped.logEvent.event === 'open_quote_form', 'conversion events are logged')
  assert(shaped.meta.cachedPromptTokens === 10240, 'cached prompt tokens reported for cost monitoring')

  const silent = await shape(1, {
    choices: [{ finish_reason: 'tool_calls', message: { role: 'assistant', content: null, tool_calls: [{ id: 't', type: 'function', function: { name: 'handoff_to_whatsapp', arguments: '{}' } }] } }],
  })
  assert(silent[0].json.reply.length > 0, 'synthesizes text when the model calls a tool with no message')
  assert(silent[0].json.assistantMessage.content === silent[0].json.reply, 'the synthesized text is what gets stored in history')

  const badArgs = await shape(1, {
    choices: [{ finish_reason: 'tool_calls', message: { role: 'assistant', content: 'Here you go.', tool_calls: [{ id: 'b', type: 'function', function: { name: 'open_quote_form', arguments: '{not json' } }] } }],
  })
  assert(badArgs[0].json.actions.length === 0 && !badArgs[0].json.assistantMessage.tool_calls, 'malformed tool arguments are dropped, not prefilled')

  const unknown = await shape(1, {
    choices: [{ finish_reason: 'tool_calls', message: { role: 'assistant', content: 'ok', tool_calls: [{ id: 'z', type: 'function', function: { name: 'send_email', arguments: '{}' } }] } }],
  })
  assert(unknown[0].json.actions.length === 0, 'tools outside the allow-list are ignored')

  const rate = await shape(1, { error: { message: 'rate limited' } }, 429)
  assert(rate[0].json.retry === true, '429 asks for one retry')

  const truncated = await shape(1, { choices: [{ finish_reason: 'length', message: { role: 'assistant', content: 'half a sen' } }] })
  assert(truncated[0].json.retry === true, 'a truncated answer retries rather than shipping half a sentence')

  const filtered = await shape(1, { choices: [{ finish_reason: 'content_filter', message: { role: 'assistant', content: '' } }] })
  assert(filtered[0].json.ok === false && filtered[0].json.actions[0].type === 'handoff_to_whatsapp', 'a filtered answer becomes a human handoff, never a silent failure')

  const dead = await shape(2, {}, 500)
  assert(dead[0].json.retry === false && dead[0].json.ok === false, 'the second attempt never asks for a third')
  assert(dead[0].json.actions[0].type === 'handoff_to_whatsapp', 'and still routes the buyer to a human')
})

await run('Attach Written Answer', async () => {
  /* The GPT-5 family often answers a tool turn with no prose. Shape Reply flags that
     and builds a follow-up request; this node merges the result back in. */
  const silentToolTurn = await runCodeNode(loadCode('assistant/shape-reply.js', { __ATTEMPT__: '1' }), {
    input: [
      {
        json: {
          statusCode: 200,
          body: {
            model: MODEL,
            choices: [
              {
                finish_reason: 'tool_calls',
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    { id: 'call_9', type: 'function', function: { name: 'show_product_cards', arguments: '{"product_ids":["desiccant"],"headline":"Fixes moisture defects"}' } },
                  ],
                },
              },
            ],
            usage: { prompt_tokens: 10500, completion_tokens: 40 },
          },
        },
      },
    ],
    nodes: { 'Guard & Build Request': { json: guardOut } },
  })

  const shaped = silentToolTurn[0].json
  assert(shaped.needsWrittenAnswer === true, 'a tool call with no content asks for a written answer')
  assert(shaped.reply.length > 0, 'and still carries a canned line as the last resort')
  assert(shaped.writtenAnswerRequest.tool_choice === 'none', 'the follow-up request disables tools so the model can only write')
  assert(
    shaped.writtenAnswerRequest.messages.length === guardOut.request.messages.length + 2,
    'the follow-up replays the cached prefix plus the tool call and its acknowledgement',
  )
  assert(
    shaped.writtenAnswerRequest.messages[shaped.writtenAnswerRequest.messages.length - 1].tool_call_id === 'call_9',
    'the acknowledgement answers the exact tool call that was made',
  )

  const attach = (body, status = 200) =>
    runCodeNode(loadCode('assistant/attach-written-answer.js'), {
      input: [{ json: { statusCode: status, body } }],
      nodes: { 'Shape Reply': { json: shaped } },
    })

  const merged = await attach({
    choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'Moisture in the regrind is the usual cause.' } }],
    usage: { completion_tokens: 99, prompt_tokens_details: { cached_tokens: 9984 } },
  })
  assert(merged[0].json.reply === 'Moisture in the regrind is the usual cause.', 'the written answer replaces the canned line')
  assert(
    merged[0].json.assistantMessage.content === 'Moisture in the regrind is the usual cause.',
    'and is what the browser stores, so the history matches what the buyer read',
  )
  assert(merged[0].json.assistantMessage.tool_calls[0].id === 'call_9', 'the tool call survives so the page still answers it next turn')
  assert(merged[0].json.meta.writtenAnswerCachedPromptTokens === 9984, 'cache reuse is reported for cost monitoring')
  assert(merged[0].json.writtenAnswerRequest === undefined, 'the follow-up request never travels on to the browser')

  const failed = await attach({ error: { message: 'upstream exploded' } }, 500)
  assert(failed[0].json.reply === shaped.reply, 'a failed follow-up keeps the canned line instead of blanking the reply')
  assert(failed[0].json.ok === true, 'and the turn still succeeds')
})

/* ─────────────────────────────── C · watchdog ─────────────────────────────── */

await run('Scan SLA & Build Digest', async () => {
  const hourAgo = new Date(Date.now() - 3600000).toISOString()
  const rows = [
    { json: { reference: 'PP-1001-AM', status: 'New', sla_due_at: hourAgo, received_at: hourAgo, company: 'Late Buyer Co.', products: 'Desiccant Masterbatch', tier: 'HOT', team: 'Additives Technical Desk', annual_volume: '25–100 t / yr' } },
    { json: { reference: 'PP-1002-CM', status: 'Quoted', sla_due_at: hourAgo, received_at: hourAgo, company: 'Already Quoted Ltd', products: 'Color Masterbatch', tier: 'WARM', team: 'Color Lab', annual_volume: '5–25 t / yr' } },
    { json: { reference: 'PP-1003-WM', status: 'New', sla_due_at: new Date(Date.now() + 86400000).toISOString(), received_at: new Date().toISOString(), company: 'Fresh Lead Co.', products: 'White Masterbatch', tier: 'WARM', team: 'Color Lab', annual_volume: '100–500 t / yr' } },
  ]
  const out = await runCodeNode(loadCode('watchdog/scan-sla.js'), { input: rows })
  assert(out.length === 1, 'emits an escalation when something is overdue')
  assert(out[0].json.overdueCount === 1, 'only open rows past their SLA count as overdue (quoted rows are ignored)')
  assert(out[0].json.html.includes('PP-1001-AM') && !out[0].json.html.includes('PP-1002-CM'), 'names the late request only')
  writeFileSync(join(previews, 'sla-escalation.html'), out[0].json.html)

  const quiet = await runCodeNode(loadCode('watchdog/scan-sla.js'), {
    input: [{ json: { reference: 'PP-1004-AM', status: 'Quoted', sla_due_at: hourAgo, received_at: '2026-01-01T00:00:00.000Z', company: 'Old Co.', products: 'x', tier: 'WARM', team: 'x', annual_volume: 'x' } }],
  })
  assert(quiet.length === 0, 'stays silent when there is nothing to chase')
})

process.stdout.write(
  failures ? `\n${failures} check group(s) failed.\n` : '\nAll Code nodes pass. Email previews in n8n/previews/.\n',
)
process.exit(failures ? 1 : 0)
