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
      options: { allowedOrigins: "https://purepolymers.net,https://www.purepolymers.net,https://oussamarevolotionary.github.io,http://localhost:8787", ignoreBots: true }
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
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return [{ json: { stub: true } }]" }
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
        conditions: [{ leftValue: expr('{{ $json.valid }}'), operator: { type: 'boolean', operation: 'true' }, rightValue: '' }],
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
        conditions: [{ leftValue: expr('{{ $json.submission_id }}'), operator: { type: 'string', operation: 'notEmpty' }, rightValue: '' }],
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
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets — Pure Polymers') },
    parameters: {
      resource: 'sheet',
      operation: 'append',
      documentId: { __rl: true, mode: 'list', value: '', cachedResultName: 'Pure Polymers — Quote Requests (Master)' },
      sheetName: { __rl: true, mode: 'name', value: 'Quote Log' },
      columns: {
        mappingMode: 'autoMapInputData',
        value: {},
        schema: [{ id: 'received_at', displayName: 'received_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'reference', displayName: 'reference', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'tier', displayName: 'tier', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'score', displayName: 'score', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'route', displayName: 'route', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'team', displayName: 'team', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'sla_due_at', displayName: 'sla_due_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'company', displayName: 'company', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'contact_name', displayName: 'contact_name', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'role', displayName: 'role', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'email', displayName: 'email', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'phone', displayName: 'phone', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'whatsapp', displayName: 'whatsapp', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'preferred_channel', displayName: 'preferred_channel', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'language', displayName: 'language', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'products', displayName: 'products', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'product_ids', displayName: 'product_ids', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'specs', displayName: 'specs', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'polymers', displayName: 'polymers', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'process', displayName: 'process', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'market', displayName: 'market', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'final_product', displayName: 'final_product', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'annual_volume', displayName: 'annual_volume', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'first_order', displayName: 'first_order', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'timeline', displayName: 'timeline', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'sample', displayName: 'sample', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'delivery_country', displayName: 'delivery_country', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'delivery_city', displayName: 'delivery_city', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'incoterm', displayName: 'incoterm', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'target_price', displayName: 'target_price', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'benchmark', displayName: 'benchmark', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'notes', displayName: 'notes', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'source_page', displayName: 'source_page', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'utm', displayName: 'utm', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'prefilled_by', displayName: 'prefilled_by', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'submission_id', displayName: 'submission_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }]
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
    credentials: { gmailOAuth2: newCredential('Gmail — Pure Polymers desk') },
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr("{{ $('Validate & Normalize').first().json.config.pilotRecipient }}"),
      subject: expr("=⚠️ Quote log write failed — {{ $('Validate & Normalize').first().json.lead.reference }} (lead is safe in the ledger)"),
      emailType: 'html',
      message: expr("=<p>Google Sheets rejected the append for <b>{{ $('Validate & Normalize').first().json.lead.reference }}</b> ({{ $('Validate & Normalize').first().json.lead.contact.company }}).</p><p>The full lead is stored in the <code>pp_quote_ledger</code> data table and the buyer still received their confirmation. Copy the row across manually.</p><pre style=\"font:12px monospace;white-space:pre-wrap\">{{ JSON.stringify($('Validate & Normalize').first().json.row, null, 2) }}</pre>"),
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

const routeColor = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: "Route · Color Lab",
    position: [1080, -260],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'team', name: 'route_team', value: "Color Lab", type: 'string' },
          { id: 'variant', name: 'route_variant', value: "color", type: 'string' },
          { id: 'recipients', name: 'route_recipients', value: "sales.color@purepolymers.net", type: 'string' },
          { id: 'cc', name: 'route_cc', value: 'info@purepolymers.net', type: 'string' },
          { id: 'focus', name: 'route_focus', value: "Confirm the shade match (Pantone / RAL / sample), let-down ratio and whether a physical sample is needed before quoting.", type: 'string' }
        ]
      },
      options: {}
    }
  },
  output: [{ route_team: "Color Lab", route_variant: "color" }]
});

const routeAdditive = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: "Route · Additives Desk",
    position: [1080, -80],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'team', name: 'route_team', value: "Additives Technical Desk", type: 'string' },
          { id: 'variant', name: 'route_variant', value: "additive", type: 'string' },
          { id: 'recipients', name: 'route_recipients', value: "technical@purepolymers.net", type: 'string' },
          { id: 'cc', name: 'route_cc', value: 'info@purepolymers.net', type: 'string' },
          { id: 'focus', name: 'route_focus', value: "Confirm dosage for the stated polymer and process, and flag any grade not documented for that polymer.", type: 'string' }
        ]
      },
      options: {}
    }
  },
  output: [{ route_team: "Additives Technical Desk", route_variant: "additive" }]
});

const routeCompound = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: "Route · Compounding Team",
    position: [1080, 100],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'team', name: 'route_team', value: "Compounding Team", type: 'string' },
          { id: 'variant', name: 'route_variant', value: "compound", type: 'string' },
          { id: 'recipients', name: 'route_recipients', value: "compounds@purepolymers.net", type: 'string' },
          { id: 'cc', name: 'route_cc', value: 'info@purepolymers.net', type: 'string' },
          { id: 'focus', name: 'route_focus', value: "Confirm base resin selection, additive package and minimum batch size for the compound.", type: 'string' }
        ]
      },
      options: {}
    }
  },
  output: [{ route_team: "Compounding Team", route_variant: "compound" }]
});

const routeTriage = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: "Route · Sales Triage",
    position: [1080, 280],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'team', name: 'route_team', value: "Sales Desk (triage)", type: 'string' },
          { id: 'variant', name: 'route_variant', value: "triage", type: 'string' },
          { id: 'recipients', name: 'route_recipients', value: "info@purepolymers.net", type: 'string' },
          { id: 'cc', name: 'route_cc', value: 'info@purepolymers.net', type: 'string' },
          { id: 'focus', name: 'route_focus', value: "Product family could not be classified automatically — assign an owner manually.", type: 'string' }
        ]
      },
      options: {}
    }
  },
  output: [{ route_team: "Sales Desk (triage)", route_variant: "triage" }]
});

const composeAlert = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Compose Sales Alert',
    position: [1340, -220],
    executeOnce: true,
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return [{ json: { stub: true } }]" }
  },
  output: [{ to: 'sales@purepolymers.net', cc: 'info@purepolymers.net', subject: '🔥 HOT · PP-8942-AM', html: '<div>…</div>', tier: 'HOT', reference: 'PP-8942-AM', pingText: 'HOT quote request PP-8942-AM' }]
});

const sendAlert = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send Sales Alert',
    position: [1560, -220],
    onError: 'continueRegularOutput',
    credentials: { gmailOAuth2: newCredential('Gmail — Pure Polymers desk') },
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr('{{ $json.to }}'),
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.html }}'),
      options: { appendAttribution: false, senderName: 'Pure Polymers Quote Pipeline', ccList: expr('{{ $json.cc }}') }
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
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets — Pure Polymers') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'list', value: '', cachedResultName: 'Pure Polymers — Quote Requests (Master)' },
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
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return [{ json: { stub: true } }]" }
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
        conditions: [{ leftValue: expr('{{ $json.hasTds }}'), operator: { type: 'boolean', operation: 'true' }, rightValue: '' }],
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
    credentials: { googleDriveOAuth2Api: newCredential('Google Drive — Pure Polymers TDS') },
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
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return [{ json: { stub: true } }]" }
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
        conditions: [{ leftValue: expr('{{ $json.hasAttachments }}'), operator: { type: 'boolean', operation: 'true' }, rightValue: '' }],
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
    credentials: { gmailOAuth2: newCredential('Gmail — Pure Polymers desk') },
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
    credentials: { gmailOAuth2: newCredential('Gmail — Pure Polymers desk') },
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

const introNote = sticky("## B · Quote Intake — the anti-ghosting pipeline\nPOST /webhook/pure-polymers/quote (schema pp.quote.v1)\n\n**Order matters:** validate → de-duplicate on submissionId → persist (data table, then master sheet) → RESPOND to the browser → only then notify.\nThe buyer never waits on Gmail, and a Sheets outage cannot lose a lead: the ledger row is already written and ops gets an alert.\n\nSetup: create the `pp_quote_ledger` data table, pick the master spreadsheet on both Sheets nodes, and set CONFIG.mode to `live` inside \"Validate & Normalize\" once the routing addresses are confirmed.", [quoteWebhook, validate, payloadValid], { color: 4 });

const notifyNote = sticky("## Dual notification\nInternal: routed by product family to the desk that prices it, with a lead score, the SLA due time and one-tap reply buttons. Hot leads can also ping WhatsApp (node disabled until a template is approved).\n\nExternal: the buyer gets the reference, a dated promise, the spec we received, the TDS from the Drive library and the 5% Colors Visualizer offer — the reason they stop shopping around.", [composeAlert, sendAlert, readTdsLibrary, resolveTds], { color: 3 });

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
