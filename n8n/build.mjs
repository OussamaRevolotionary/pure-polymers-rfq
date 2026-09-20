/**
 * Builds the Pure Polymers n8n workflows.
 *
 *   node n8n/build.mjs
 *
 * 1. reads the Code-node sources in n8n/code (expanding @include / @inject),
 * 2. emits n8n Workflow SDK source into n8n/sdk (validated by the n8n MCP server too),
 * 3. compiles each with the SDK's own interpreter into importable JSON in n8n/workflows.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseWorkflowCodeToBuilder } from '@n8n/workflow-sdk'
import { TOOLS } from '../agent/src/tools.mjs'
import { buildSystemPrompt } from '../agent/src/systemPrompt.mjs'
import { API, MODEL } from '../agent/src/request.mjs'

/**
 * Credentials in the target n8n instance. Delete the `id` of an entry to make that
 * node ask for a credential on import instead of binding to this instance.
 */
const CREDS = {
  sheets: ['Google Sheets oussama19', '4skWlyOrFj84KJxt'],
  gmail: ['oussamalabs', 'dOUKyFaNKoqvOG7O'],
  drive: ['Google Drive account', 'NNBcR47K9hjDpeHN'],
  openai: ['Hassen API', 'WmmdMXKKtcdpSYYk'],
}
const cred = (key) => {
  const [name, id] = CREDS[key]
  return id ? `newCredential(${JSON.stringify(name)}, ${JSON.stringify(id)})` : `newCredential(${JSON.stringify(name)})`
}

const here = dirname(fileURLToPath(import.meta.url))
const codeDir = join(here, 'code')
const sdkDir = join(here, 'sdk')
const outDir = join(here, 'workflows')
mkdirSync(sdkDir, { recursive: true })
mkdirSync(outDir, { recursive: true })

const ALLOWED_ORIGINS = 'https://purepolymers.net,https://www.purepolymers.net,https://oussamarevolotionary.github.io,http://localhost:8787'

/** Code nodes cannot import, so shared helpers and generated constants are inlined here. */
function loadCode(relativePath, replacements = {}) {
  // Normalise CRLF so the embedded code is identical on Windows and Linux.
  let source = readFileSync(join(codeDir, relativePath), 'utf8').split('\r\n').join('\n')
  source = source.replace(/^\s*\/\/ @include (.+)$/gm, (_, target) =>
    readFileSync(join(codeDir, target.trim()), 'utf8').replace(/^\/\* @shared.*\*\/\n/, ''),
  )
  source = source.replace(/^\s*\/\/ @inject SYSTEM_PROMPT$/gm, () => {
    const prompt = buildSystemPrompt()
    /* A template literal keeps the prompt readable - and diffable in git - inside the
       workflow JSON, instead of one 38 kB line of escape sequences. Safe only while the
       prompt contains no backtick, backslash or template placeholder. */
    const templateSafe = !/[`\\]/.test(prompt) && !prompt.includes('${')
    return `const SYSTEM_PROMPT = ${templateSafe ? '`' + prompt + '`' : JSON.stringify(prompt)}`
  })
  source = source.replace(/^\s*\/\/ @inject TOOLS$/gm, () => `const TOOLS = ${JSON.stringify(TOOLS)}`)
  for (const [token, value] of Object.entries(replacements)) source = source.split(token).join(value)
  return source
}

const js = (value) => JSON.stringify(value)

/* ────────────────────────────── B · Quote Intake ────────────────────────────── */

const quoteIntake = `
const quoteWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Quote Webhook',
    position: [-1120, 0],
    parameters: {
      httpMethod: 'POST',
      path: 'pure-polymers/quote',
      responseMode: 'responseNode',
      options: { allowedOrigins: ${js(ALLOWED_ORIGINS)}, ignoreBots: true }
    }
  },
  output: [{ body: { schema: 'pp.quote.v1', reference: 'PP-8942-AM', submissionId: '2f5c2b40-1f2a-4f0e-9e4f-d1a0a1d4f001' } }]
});

const validate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validate & Normalize',
    position: [-900, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${js(loadCode('quote/validate-normalize.js'))} }
  },
  output: [{ valid: true, spam: false, httpStatus: 200, errors: [], lead: { reference: 'PP-8942-AM', route: 'additive', tier: 'HOT' }, row: { reference: 'PP-8942-AM' } }]
});

const payloadValid = ifElse({
  version: 2.3,
  config: {
    name: 'Payload Valid?',
    position: [-680, 0],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.valid }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }],
        combinator: 'and'
      }
    }
  }
});

const respondRejected = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond · Rejected',
    position: [-460, 180],
    parameters: {
      respondWith: 'json',
      responseBody: expr('={{ JSON.stringify({ ok: $json.spam, reference: $json.lead.reference, errors: $json.spam ? [] : $json.errors }) }}'),
      options: { responseCode: expr('{{ $json.httpStatus }}') }
    }
  }
});

const findPrior = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Find Prior Submission',
    position: [-460, -60],
    alwaysOutputData: true,
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: { __rl: true, mode: 'name', value: 'pp_quote_ledger' },
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'submission_id', condition: 'eq', keyValue: expr('{{ $json.lead.submissionId }}') }] },
      returnAll: false,
      limit: 1
    }
  },
  output: [{ id: 1, submission_id: '2f5c2b40-1f2a-4f0e-9e4f-d1a0a1d4f001', reference: 'PP-8942-AM' }]
});

const alreadyLogged = ifElse({
  version: 2.3,
  config: {
    name: 'Already Logged?',
    position: [-240, -60],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.submission_id }}'), operator: { type: 'string', operation: 'notEmpty', singleValue: true }, rightValue: '' }],
        combinator: 'and'
      },
      looseTypeValidation: true
    }
  }
});

const respondDuplicate = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond · Duplicate',
    position: [-20, -200],
    parameters: {
      respondWith: 'json',
      responseBody: expr("={{ JSON.stringify({ ok: true, duplicate: true, reference: $('Validate & Normalize').first().json.lead.reference }) }}"),
      options: { responseCode: 200 }
    }
  }
});

const writeLedger = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Write Ledger Row',
    position: [-20, 40],
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 1500,
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: { __rl: true, mode: 'name', value: 'pp_quote_ledger' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          submission_id: expr("{{ $('Validate & Normalize').first().json.lead.submissionId }}"),
          reference: expr("{{ $('Validate & Normalize').first().json.lead.reference }}"),
          received_at: expr("{{ $('Validate & Normalize').first().json.lead.receivedAtIso }}"),
          route: expr("{{ $('Validate & Normalize').first().json.lead.route }}"),
          tier: expr("{{ $('Validate & Normalize').first().json.lead.tier }}"),
          email: expr("{{ $('Validate & Normalize').first().json.lead.contact.email }}"),
          company: expr("{{ $('Validate & Normalize').first().json.lead.contact.company }}"),
          payload_json: expr("={{ JSON.stringify($('Validate & Normalize').first().json.lead) }}")
        },
        schema: [
          { id: 'submission_id', displayName: 'submission_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'reference', displayName: 'reference', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'received_at', displayName: 'received_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'route', displayName: 'route', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'tier', displayName: 'tier', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'email', displayName: 'email', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'company', displayName: 'company', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'payload_json', displayName: 'payload_json', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]
      },
      options: {}
    }
  },
  output: [{ id: 1 }]
});

const appendSheet = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Append to Master Quote Log',
    position: [200, 40],
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2000,
    onError: 'continueErrorOutput',
    credentials: { googleSheetsOAuth2Api: ${cred('sheets')} },
    parameters: {
      resource: 'sheet',
      operation: 'append',
      documentId: { __rl: true, mode: 'id', value: '1DUd4fQiYWlL86c7_Io0GjQ2oM6u8vcK99Bkw9xXs3ks', cachedResultName: 'Pure Polymers — Quote Requests (Master)' },
      sheetName: { __rl: true, mode: 'name', value: 'Quote Log' },
      columns: {
        mappingMode: 'autoMapInputData',
        value: {},
        schema: [${[
          'received_at', 'reference', 'status', 'tier', 'score', 'route', 'team', 'sla_due_at', 'company', 'contact_name', 'role', 'email',
          'phone', 'whatsapp', 'preferred_channel', 'language', 'products', 'product_ids', 'specs', 'polymers', 'process', 'market',
          'final_product', 'annual_volume', 'first_order', 'timeline', 'sample', 'delivery_country', 'delivery_city', 'incoterm',
          'target_price', 'benchmark', 'notes', 'source_page', 'utm', 'prefilled_by', 'submission_id',
        ]
          .map(
            (id) =>
              `{ id: '${id}', displayName: '${id}', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }`,
          )
          .join(', ')}]
      },
      options: { cellFormat: 'USER_ENTERED', handlingExtraData: 'insertInNewColumn' }
    }
  },
  output: [{ reference: 'PP-8942-AM' }]
});

const flattenRow = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Sheet Row',
    position: [-20, 200],
    parameters: {
      mode: 'raw',
      jsonOutput: expr("={{ JSON.stringify($('Validate & Normalize').first().json.row) }}"),
      includeOtherFields: false,
      options: {}
    }
  },
  output: [{ reference: 'PP-8942-AM', status: 'New' }]
});

const alertOps = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Alert Ops · Sheet Write Failed',
    position: [420, 220],
    onError: 'continueRegularOutput',
    credentials: { gmailOAuth2: ${cred('gmail')} },
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr("{{ $('Validate & Normalize').first().json.config.opsRecipient }}"),
      subject: expr("=⚠️ Quote log write failed — {{ $('Validate & Normalize').first().json.lead.reference }} (lead is safe in the ledger)"),
      emailType: 'html',
      message: expr("=<p>Google Sheets rejected the append for <b>{{ $('Validate & Normalize').first().json.lead.reference }}</b> ({{ $('Validate & Normalize').first().json.lead.contact.company }}).</p><p>The full lead is stored in the <code>pp_quote_ledger</code> data table and the buyer still received their confirmation. Copy the row across manually.</p><pre style=\\"font:12px monospace;white-space:pre-wrap\\">{{ JSON.stringify($('Validate & Normalize').first().json.row, null, 2) }}</pre>"),
      options: { appendAttribution: false, senderName: 'Pure Polymers Pipeline' }
    }
  },
  output: [{ id: 'gmail-id' }]
});

const respondLogged = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond · Logged',
    position: [420, 0],
    parameters: {
      respondWith: 'json',
      responseBody: expr("={{ JSON.stringify({ ok: true, reference: $('Validate & Normalize').first().json.lead.reference, receivedAt: $('Validate & Normalize').first().json.lead.receivedAtIso, quotationDueAt: $('Validate & Normalize').first().json.lead.slaDueIso, team: $('Validate & Normalize').first().json.lead.team, storage: 'sheet' }) }}"),
      options: { responseCode: 200 }
    }
  },
  output: [{ ok: true }]
});

const respondLedger = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond · Logged (ledger)',
    position: [640, 220],
    parameters: {
      respondWith: 'json',
      responseBody: expr("={{ JSON.stringify({ ok: true, reference: $('Validate & Normalize').first().json.lead.reference, receivedAt: $('Validate & Normalize').first().json.lead.receivedAtIso, quotationDueAt: $('Validate & Normalize').first().json.lead.slaDueIso, team: $('Validate & Normalize').first().json.lead.team, storage: 'ledger' }) }}"),
      options: { responseCode: 200 }
    }
  },
  output: [{ ok: true }]
});

const routeSwitch = switchCase({
  version: 3.4,
  config: {
    name: 'Route by Product Family',
    position: [860, 0],
    parameters: {
      mode: 'rules',
      rules: {
        values: [
          {
            renameOutput: true,
            outputKey: 'Color · white · black',
            conditions: {
              options: { caseSensitive: false, leftValue: '', typeValidation: 'strict', version: 2 },
              conditions: [{ leftValue: expr("{{ $('Validate & Normalize').first().json.lead.route }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'color_pigment' }],
              combinator: 'and'
            }
          },
          {
            renameOutput: true,
            outputKey: 'Additives',
            conditions: {
              options: { caseSensitive: false, leftValue: '', typeValidation: 'strict', version: 2 },
              conditions: [{ leftValue: expr("{{ $('Validate & Normalize').first().json.lead.route }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'additive' }],
              combinator: 'and'
            }
          },
          {
            renameOutput: true,
            outputKey: 'Compounds',
            conditions: {
              options: { caseSensitive: false, leftValue: '', typeValidation: 'strict', version: 2 },
              conditions: [{ leftValue: expr("{{ $('Validate & Normalize').first().json.lead.route }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'compound' }],
              combinator: 'and'
            }
          }
        ]
      },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'Unclassified' }
    }
  }
});

${[
  { handle: 'routeColor', name: 'Route · Color Lab', y: -260, team: 'Color Lab', variant: 'color', to: 'sales.color@purepolymers.net', focus: 'Confirm the shade match (Pantone / RAL / sample), let-down ratio and whether a physical sample is needed before quoting.' },
  { handle: 'routeAdditive', name: 'Route · Additives Desk', y: -80, team: 'Additives Technical Desk', variant: 'additive', to: 'technical@purepolymers.net', focus: 'Confirm dosage for the stated polymer and process, and flag any grade not documented for that polymer.' },
  { handle: 'routeCompound', name: 'Route · Compounding Team', y: 100, team: 'Compounding Team', variant: 'compound', to: 'compounds@purepolymers.net', focus: 'Confirm base resin selection, additive package and minimum batch size for the compound.' },
  { handle: 'routeTriage', name: 'Route · Sales Triage', y: 280, team: 'Sales Desk (triage)', variant: 'triage', to: 'info@purepolymers.net', focus: 'Product family could not be classified automatically — assign an owner manually.' },
]
  .map(
    (route) => `const ${route.handle} = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: ${js(route.name)},
    position: [1080, ${route.y}],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'team', name: 'route_team', value: ${js(route.team)}, type: 'string' },
          { id: 'variant', name: 'route_variant', value: ${js(route.variant)}, type: 'string' },
          { id: 'recipients', name: 'route_recipients', value: ${js(route.to)}, type: 'string' },
          { id: 'cc', name: 'route_cc', value: 'info@purepolymers.net', type: 'string' },
          { id: 'focus', name: 'route_focus', value: ${js(route.focus)}, type: 'string' }
        ]
      },
      options: {}
    }
  },
  output: [{ route_team: ${js(route.team)}, route_variant: ${js(route.variant)} }]
});`,
  )
  .join('\n\n')}

const composeAlert = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Compose Sales Alert',
    position: [1340, -220],
    executeOnce: true,
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${js(loadCode('quote/compose-sales-alert.js'))} }
  },
  output: [{ to: 'sales@purepolymers.net', cc: 'info@purepolymers.net', bcc: '', subject: '🔥 HOT · PP-8942-AM', html: '<div>…</div>', tier: 'HOT', reference: 'PP-8942-AM', pingText: 'HOT quote request PP-8942-AM' }]
});

const sendAlert = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send Sales Alert',
    position: [1560, -220],
    onError: 'continueRegularOutput',
    credentials: { gmailOAuth2: ${cred('gmail')} },
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr('{{ $json.to }}'),
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.html }}'),
      options: { appendAttribution: false, senderName: 'Pure Polymers Quote Pipeline', ccList: expr('{{ $json.cc }}'), bccList: expr('{{ $json.bcc }}') }
    }
  },
  output: [{ id: 'gmail-id' }]
});

const isHotLead = ifElse({
  version: 2.3,
  config: {
    name: 'Hot Lead?',
    position: [1780, -220],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr("{{ $('Compose Sales Alert').first().json.tier }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'HOT' }],
        combinator: 'and'
      }
    }
  }
});

const whatsappPing = node({
  type: 'n8n-nodes-base.whatsApp',
  version: 1.1,
  config: {
    name: 'WhatsApp Ping · Hot Lead',
    position: [2000, -300],
    disabled: true,
    onError: 'continueRegularOutput',
    credentials: { whatsAppApi: newCredential('WhatsApp Business — Pure Polymers') },
    parameters: {
      resource: 'message',
      operation: 'sendTemplate',
      phoneNumberId: placeholder('WhatsApp Business phone number ID'),
      recipientPhoneNumber: '966546460891',
      template: placeholder('Approved template name, e.g. new_quote_alert'),
      components: {
        component: [
          {
            type: 'body',
            bodyParameters: {
              parameter: [
                { type: 'text', text: expr("{{ $('Compose Sales Alert').first().json.reference }}") },
                { type: 'text', text: expr("{{ $('Compose Sales Alert').first().json.pingText }}") }
              ]
            }
          }
        ]
      }
    }
  },
  output: [{ messaging_product: 'whatsapp' }]
});

const readTdsLibrary = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Read TDS Library',
    position: [1340, 120],
    executeOnce: true,
    alwaysOutputData: true,
    onError: 'continueRegularOutput',
    credentials: { googleSheetsOAuth2Api: ${cred('sheets')} },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'id', value: '1DUd4fQiYWlL86c7_Io0GjQ2oM6u8vcK99Bkw9xXs3ks', cachedResultName: 'Pure Polymers — Quote Requests (Master)' },
      sheetName: { __rl: true, mode: 'name', value: 'TDS_Library' },
      options: { returnAllMatches: 'returnAllMatches' }
    }
  },
  output: [{ product_id: 'desiccant', product_name: 'Desiccant Masterbatch', tds_file_id: '1AbC…', tds_file_name: 'TDS-DES01.pdf', version: 'v3' }]
});

const resolveTds = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resolve TDS Files',
    position: [1560, 120],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${js(loadCode('quote/resolve-tds.js'))} }
  },
  output: [{ hasTds: true, tdsFiles: [{ productId: 'desiccant', fileId: '1AbC…', fileName: 'TDS-DES01.pdf' }], missing: [] }]
});

const hasTds = ifElse({
  version: 2.3,
  config: {
    name: 'Has TDS on File?',
    position: [1780, 120],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.hasTds }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }],
        combinator: 'and'
      }
    }
  }
});

const splitTds = node({
  type: 'n8n-nodes-base.splitOut',
  version: 1,
  config: {
    name: 'Split TDS Files',
    position: [2000, 40],
    parameters: { fieldToSplitOut: 'tdsFiles', include: 'noOtherFields', options: {} }
  },
  output: [{ productId: 'desiccant', fileId: '1AbC…', fileName: 'TDS-DES01.pdf' }]
});

const downloadTds = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'Download TDS',
    position: [2220, 40],
    onError: 'continueRegularOutput',
    retryOnFail: true,
    maxTries: 2,
    credentials: { googleDriveOAuth2Api: ${cred('drive')} },
    parameters: {
      resource: 'file',
      operation: 'download',
      fileId: { __rl: true, mode: 'id', value: expr('{{ $json.fileId }}') },
      options: { binaryPropertyName: 'data', fileName: expr('{{ $json.fileName }}') }
    }
  },
  output: [{ id: '1AbC…', name: 'TDS-DES01.pdf' }]
});

const bundleCompose = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Bundle TDS & Compose Buyer Email',
    position: [2440, 120],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${js(loadCode('quote/compose-buyer-email.js'))} }
  },
  output: [{ to: 'buyer@example.com', subject: 'Your quote request PP-8942-AM', html: '<div>…</div>', attachmentProps: 'tds_0', hasAttachments: true }]
});

const attachmentsReady = ifElse({
  version: 2.3,
  config: {
    name: 'Attachments Ready?',
    position: [2660, 120],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.hasAttachments }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }],
        combinator: 'and'
      }
    }
  }
});

const sendBuyerWithTds = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send Buyer Confirmation + TDS',
    position: [2880, 40],
    onError: 'continueRegularOutput',
    retryOnFail: true,
    maxTries: 2,
    credentials: { gmailOAuth2: ${cred('gmail')} },
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr('{{ $json.to }}'),
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.html }}'),
      options: {
        appendAttribution: false,
        senderName: 'Pure Polymers Sales Desk',
        replyTo: expr('{{ $json.replyTo }}'),
        attachmentsUi: { attachmentsBinary: [{ property: expr('{{ $json.attachmentProps }}') }] }
      }
    }
  },
  output: [{ id: 'gmail-id' }]
});

const sendBuyerPlain = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send Buyer Confirmation',
    position: [2880, 220],
    onError: 'continueRegularOutput',
    retryOnFail: true,
    maxTries: 2,
    credentials: { gmailOAuth2: ${cred('gmail')} },
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr('{{ $json.to }}'),
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.html }}'),
      options: { appendAttribution: false, senderName: 'Pure Polymers Sales Desk', replyTo: expr('{{ $json.replyTo }}') }
    }
  },
  output: [{ id: 'gmail-id' }]
});

const introNote = sticky(${js(
  '## B · Quote Intake — the anti-ghosting pipeline\n' +
    'POST /webhook/pure-polymers/quote (schema pp.quote.v1)\n\n' +
    '**Order matters:** validate → de-duplicate on submissionId → persist (data table, then master sheet) → RESPOND to the browser → only then notify.\n' +
    'The buyer never waits on Gmail, and a Sheets outage cannot lose a lead: the ledger row is already written and ops gets an alert.\n\n' +
    'Setup: create the `pp_quote_ledger` data table, pick the master spreadsheet on both Sheets nodes, and set CONFIG.mode to `live` inside "Validate & Normalize" once the routing addresses are confirmed.',
)}, [quoteWebhook, validate, payloadValid], { color: 4 });

const notifyNote = sticky(${js(
  '## Dual notification\n' +
    'Internal: routed by product family to the desk that prices it, with a lead score, the SLA due time and one-tap reply buttons. Hot leads can also ping WhatsApp (node disabled until a template is approved).\n\n' +
    'External: the buyer gets the reference, a dated promise, the spec we received, the TDS from the Drive library and the 5% Colors Visualizer offer — the reason they stop shopping around.',
)}, [composeAlert, sendAlert, readTdsLibrary, resolveTds], { color: 3 });

export default workflow('pp-b-quote-intake', 'Pure Polymers — B — Quote Intake')
  .add(quoteWebhook)
  .to(validate)
  .to(
    payloadValid
      .onTrue(
        findPrior.to(
          alreadyLogged
            .onTrue(respondDuplicate)
            .onFalse(
              writeLedger.to(flattenRow.to(appendSheet.onError(alertOps.to(respondLedger)).to(respondLogged)))
            )
        )
      )
      .onFalse(respondRejected)
  )
  .add(respondLogged)
  .to(routeSwitch.onCase(0, routeColor).onCase(1, routeAdditive).onCase(2, routeCompound).onCase(3, routeTriage))
  .add(respondLedger)
  .to(routeSwitch)
  .add(routeColor)
  .to(composeAlert)
  .add(routeAdditive)
  .to(composeAlert)
  .add(routeCompound)
  .to(composeAlert)
  .add(routeTriage)
  .to(composeAlert)
  .add(routeColor)
  .to(readTdsLibrary)
  .add(routeAdditive)
  .to(readTdsLibrary)
  .add(routeCompound)
  .to(readTdsLibrary)
  .add(routeTriage)
  .to(readTdsLibrary)
  .add(composeAlert)
  .to(sendAlert)
  .to(isHotLead.onTrue(whatsappPing))
  .add(readTdsLibrary)
  .to(resolveTds)
  .to(hasTds.onTrue(splitTds.to(downloadTds.to(bundleCompose))).onFalse(bundleCompose))
  .add(bundleCompose)
  .to(attachmentsReady.onTrue(sendBuyerWithTds).onFalse(sendBuyerPlain))
  .add(introNote)
  .add(notifyNote);
`

/* ────────────────────────────── A · AI Assistant ────────────────────────────── */

const assistant = `
const assistantWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Assistant Webhook',
    position: [-760, 0],
    parameters: {
      httpMethod: 'POST',
      path: 'pure-polymers/assistant',
      responseMode: 'responseNode',
      options: { allowedOrigins: ${js(ALLOWED_ORIGINS)}, ignoreBots: true }
    }
  },
  output: [{ body: { sessionId: 'ba0d…', language: 'en', messages: [{ role: 'user', content: 'Fish-eyes in recycled LLDPE film?' }] } }]
});

const guard = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Guard & Build Request',
    position: [-540, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${js(
      loadCode('assistant/guard-build-request.js', { __MODEL__: MODEL }),
    )} }
  },
  output: [{ blocked: false, sessionId: 'ba0d', language: 'en', request: { model: ${js(MODEL)} } }]
});

const blocked = ifElse({
  version: 2.3,
  config: {
    name: 'Blocked?',
    position: [-320, 0],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.blocked }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }],
        combinator: 'and'
      }
    }
  }
});

const callModel = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Call OpenAI',
    position: [-100, 120],
    credentials: { openAiApi: ${cred('openai')} },
    parameters: {
      method: 'POST',
      url: ${js(API.url)},
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ JSON.stringify($json.request) }}'),
      options: { timeout: 90000, response: { response: { fullResponse: true, neverError: true } } }
    }
  },
  output: [{ statusCode: 200, body: { model: ${js(MODEL)}, choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'That points to moisture in the regrind.' } }], usage: { prompt_tokens: 11200, completion_tokens: 90 } } }]
});

const shapeReply = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Shape Reply',
    position: [120, 120],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${js(
      loadCode('assistant/shape-reply.js', { __ATTEMPT__: '1' }),
    )} }
  },
  output: [{ retry: false, ok: true, reply: 'That points to moisture in the regrind.', actions: [], assistantMessage: { role: 'assistant', content: 'That points to moisture in the regrind.' } }]
});

const needsRetry = ifElse({
  version: 2.3,
  config: {
    name: 'Retry Needed?',
    position: [340, 120],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.retry }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }],
        combinator: 'and'
      }
    }
  }
});

const waitBeforeRetry = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Back Off 2s', position: [560, 220], parameters: { resume: 'timeInterval', amount: 2, unit: 'seconds' } },
  output: [{ retry: true }]
});

const callModelRetry = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Call OpenAI (retry)',
    position: [780, 220],
    credentials: { openAiApi: ${cred('openai')} },
    parameters: {
      method: 'POST',
      url: ${js(API.url)},
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("={{ JSON.stringify($('Guard & Build Request').first().json.request) }}"),
      options: { timeout: 90000, response: { response: { fullResponse: true, neverError: true } } }
    }
  },
  output: [{ statusCode: 200, body: { model: ${js(MODEL)}, choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'Recovered on retry.' } }] } }]
});

const shapeReplyFinal = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Shape Reply (final)',
    position: [1000, 220],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${js(
      loadCode('assistant/shape-reply.js', { __ATTEMPT__: '2' }),
    )} }
  },
  output: [{ retry: false, ok: true, reply: 'Recovered on retry.', actions: [] }]
});

const writtenAnswerMissing = ifElse({
  version: 2.3,
  config: {
    name: 'Written Answer Missing?',
    position: [560, 0],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.needsWrittenAnswer }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }],
        combinator: 'and'
      },
      looseTypeValidation: true
    }
  }
});

const callModelWritten = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Call OpenAI (written answer)',
    position: [780, -120],
    onError: 'continueRegularOutput',
    credentials: { openAiApi: ${cred('openai')} },
    parameters: {
      method: 'POST',
      url: ${js(API.url)},
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ JSON.stringify($json.writtenAnswerRequest) }}'),
      options: { timeout: 60000, response: { response: { fullResponse: true, neverError: true } } }
    }
  },
  output: [{ statusCode: 200, body: { choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'That points to moisture in the regrind.' } }] } }]
});

const attachWritten = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Attach Written Answer',
    position: [1000, -120],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${js(loadCode('assistant/attach-written-answer.js'))} }
  },
  output: [{ ok: true, reply: 'That points to moisture in the regrind.', actions: [] }]
});

const respondAssistant = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Browser',
    position: [1440, 0],
    parameters: {
      respondWith: 'json',
      responseBody: expr('={{ JSON.stringify({ ok: $json.ok, reply: $json.reply, actions: $json.actions || [], assistantMessage: $json.assistantMessage || null, meta: $json.meta || null }) }}'),
      options: { responseCode: 200 }
    }
  },
  output: [{ ok: true, shouldLog: true, sessionId: 'ba0d', logEvent: { event: 'open_quote_form', products: 'desiccant', summary: 'Desiccant for LLDPE blown film, 25-100 t/yr' } }]
});

const shouldLog = ifElse({
  version: 2.3,
  config: {
    name: 'Conversion Event?',
    position: [1660, 0],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.shouldLog }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }],
        combinator: 'and'
      },
      looseTypeValidation: true
    }
  }
});

const logEvent = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Log Assistant Event',
    position: [1880, -80],
    onError: 'continueRegularOutput',
    credentials: { googleSheetsOAuth2Api: ${cred('sheets')} },
    parameters: {
      resource: 'sheet',
      operation: 'append',
      documentId: { __rl: true, mode: 'id', value: '1DUd4fQiYWlL86c7_Io0GjQ2oM6u8vcK99Bkw9xXs3ks', cachedResultName: 'Pure Polymers — Quote Requests (Master)' },
      sheetName: { __rl: true, mode: 'name', value: 'Assistant_Events' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          timestamp: expr('{{ $now.toISO() }}'),
          session_id: expr('{{ $json.sessionId }}'),
          event: expr('{{ $json.logEvent.event }}'),
          reason: expr('{{ $json.logEvent.reason }}'),
          urgency: expr('{{ $json.logEvent.urgency }}'),
          products: expr('{{ $json.logEvent.products }}'),
          polymers: expr('{{ $json.logEvent.polymers }}'),
          process: expr('{{ $json.logEvent.process }}'),
          volume: expr('{{ $json.logEvent.volume }}'),
          timeline: expr('{{ $json.logEvent.timeline }}'),
          summary: expr('{{ $json.logEvent.summary }}')
        },
        schema: [${['timestamp', 'session_id', 'event', 'reason', 'urgency', 'products', 'polymers', 'process', 'volume', 'timeline', 'summary']
          .map(
            (id) =>
              `{ id: '${id}', displayName: '${id}', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }`,
          )
          .join(', ')}]
      },
      options: {}
    }
  },
  output: [{ timestamp: '2026-09-20T09:00:00.000Z' }]
});

const assistantNote = sticky(${js(
  '## A · AI Assistant backend (' + MODEL + ')\n' +
    'POST /webhook/pure-polymers/assistant → { reply, actions, assistantMessage }\n\n' +
    'Stateless: the browser owns the conversation and posts it whole each turn, so the ~10.6k-token system prefix stays byte-identical and OpenAI prompt caching keeps hitting (watch meta.cachedPromptTokens).\n\n' +
    'The three tools are UI actions executed by the PAGE, not here — show product cards, prefill the quote form, hand off to WhatsApp. The browser answers each tool_call with a tool message on the next turn.\n\n' +
    'The Guard node validates the transcript but never rewrites it: a malformed history gets a deterministic WhatsApp handoff instead of a silently repaired conversation. One bounded retry covers 429/5xx and truncated answers.',
)}, [assistantWebhook, guard, blocked], { color: 5 });

export default workflow('pp-a-assistant', 'Pure Polymers — A — AI Assistant')
  .add(assistantWebhook)
  .to(guard)
  .to(
    blocked
      .onTrue(respondAssistant)
      .onFalse(
        callModel.to(shapeReply).to(
          needsRetry
            .onFalse(writtenAnswerMissing.onTrue(callModelWritten.to(attachWritten.to(respondAssistant))).onFalse(respondAssistant))
            .onTrue(waitBeforeRetry.to(callModelRetry.to(shapeReplyFinal.to(respondAssistant))))
        )
      )
  )
  .add(respondAssistant)
  .to(shouldLog.onTrue(logEvent))
  .add(assistantNote);
`

/* ────────────────────────────── C · SLA Watchdog ────────────────────────────── */

const watchdog = `
const schedule = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Sun–Thu · 08:00, 12:00, 16:00',
    position: [-560, 0],
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 0 8,12,16 * * 0-4' }] } }
  },
  output: [{}]
});

const readLog = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Read Master Quote Log',
    position: [-340, 0],
    credentials: { googleSheetsOAuth2Api: ${cred('sheets')} },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'id', value: '1DUd4fQiYWlL86c7_Io0GjQ2oM6u8vcK99Bkw9xXs3ks', cachedResultName: 'Pure Polymers — Quote Requests (Master)' },
      sheetName: { __rl: true, mode: 'name', value: 'Quote Log' },
      options: { returnAllMatches: 'returnAllMatches' }
    }
  },
  output: [{ reference: 'PP-8942-AM', status: 'New', sla_due_at: '2026-09-22T14:00:00.000Z', company: 'Demo Packaging Co.', products: 'Desiccant Masterbatch', tier: 'HOT', team: 'Additives Technical Desk', annual_volume: '25–100 t / yr', received_at: '2026-09-20T09:00:00.000Z' }]
});

const scanSla = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Scan SLA & Build Digest',
    position: [-120, 0],
    executeOnce: true,
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${js(loadCode('watchdog/scan-sla.js'))} }
  },
  output: [{ to: 'sales@purepolymers.net', subject: '⏰ 2 Pure Polymers quotation(s) past due', html: '<div>…</div>', overdueCount: 2, newCount: 5 }]
});

const sendEscalation = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send SLA Escalation',
    position: [100, 0],
    credentials: { gmailOAuth2: ${cred('gmail')} },
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr('{{ $json.to }}'),
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.html }}'),
      options: { appendAttribution: false, senderName: 'Pure Polymers Quote Pipeline' }
    }
  },
  output: [{ id: 'gmail-id' }]
});

const watchdogNote = sticky(${js(
  '## C · SLA watchdog & morning digest\n' +
    'The promise on the confirmation page is "a formal quotation within 2 business days". This is the node that keeps it true.\n\n' +
    'Runs Sunday–Thursday at 08:00, 12:00 and 16:00 Asia/Riyadh (set the workflow timezone to Asia/Riyadh). It emails only when something is overdue, plus a digest of the last 24 h on the 08:00 run — no noise, so the alert keeps its meaning.\n\n' +
    'Set the row status to anything other than New / In review once a quotation is sent, and the reminder stops.',
)}, [schedule, readLog, scanSla], { color: 6 });

export default workflow('pp-c-sla-watchdog', 'Pure Polymers — C — SLA Watchdog')
  .add(schedule)
  .to(readLog)
  .to(scanSla)
  .to(sendEscalation)
  .add(watchdogNote);
`

/* ────────────────────────────── compile ────────────────────────────── */

const workflows = [
  { file: 'pp-b-quote-intake', code: quoteIntake, settings: { executionOrder: 'v1', timezone: 'Asia/Riyadh' } },
  { file: 'pp-a-assistant', code: assistant, settings: { executionOrder: 'v1', timezone: 'Asia/Riyadh' } },
  { file: 'pp-c-sla-watchdog', code: watchdog, settings: { executionOrder: 'v1', timezone: 'Asia/Riyadh' } },
]

let failures = 0
for (const item of workflows) {
  const sdkPath = join(sdkDir, `${item.file}.workflow.ts`)
  writeFileSync(sdkPath, item.code.trimStart())
  try {
    const builder = parseWorkflowCodeToBuilder(item.code)
    const result = builder.validate()
    for (const warning of result.warnings) console.warn(`  ⚠ ${item.file}: ${warning.message}`)
    if (result.errors.length) {
      failures += 1
      for (const error of result.errors) console.error(`  ✖ ${item.file}: ${error.message}`)
      continue
    }
    const json = builder.toJSON()
    json.settings = { ...(json.settings || {}), ...item.settings }
    writeFileSync(join(outDir, `${item.file}.json`), JSON.stringify(json, null, 2) + '\n')
    console.log(`  ✓ ${item.file}: ${json.nodes.length} nodes → n8n/workflows/${item.file}.json`)
  } catch (error) {
    failures += 1
    console.error(`  ✖ ${item.file}: ${error.message}`)
  }
}

if (failures) {
  console.error(`\n${failures} workflow(s) failed to build.`)
  process.exit(1)
}
console.log('\nAll workflows built. Import the JSON files in n8n, then bind credentials.')
