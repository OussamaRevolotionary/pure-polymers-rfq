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
      options: { allowedOrigins: "https://purepolymers.net,https://www.purepolymers.net,https://oussamarevolotionary.github.io,http://localhost:8787", ignoreBots: true }
    }
  },
  output: [{ body: { sessionId: 'ba0d…', language: 'en', messages: [{ role: 'user', content: 'Fish-eyes in recycled LLDPE film?' }] } }]
});

const guard = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Guard & Build Claude Request',
    position: [-540, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return [{ json: { stub: true } }]" }
  },
  output: [{ blocked: false, sessionId: 'ba0d…', language: 'en', request: { model: 'claude-opus-5' } }]
});

const blocked = ifElse({
  version: 2.3,
  config: {
    name: 'Blocked?',
    position: [-320, 0],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.blocked }}'), operator: { type: 'boolean', operation: 'true' }, rightValue: '' }],
        combinator: 'and'
      }
    }
  }
});

const callClaude = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Call Claude',
    position: [-100, 120],
    credentials: { httpTemplatedCustomAuth: newCredential('Anthropic API (x-api-key)') },
    parameters: {
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'anthropic-version', value: '2023-06-01' },
          { name: 'anthropic-beta', value: 'server-side-fallback-2026-07-01' },
          { name: 'content-type', value: 'application/json' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ JSON.stringify($json.request) }}'),
      options: { timeout: 90000, response: { response: { fullResponse: true, neverError: true } } }
    }
  },
  output: [{ statusCode: 200, body: { content: [{ type: 'text', text: '…' }], stop_reason: 'end_turn', usage: { input_tokens: 11000 } } }]
});

const shapeReply = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Shape Reply',
    position: [120, 120],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return [{ json: { stub: true } }]" }
  },
  output: [{ retry: false, ok: true, reply: 'That pattern usually points to moisture…', actions: [], assistantContent: [] }]
});

const needsRetry = ifElse({
  version: 2.3,
  config: {
    name: 'Retry Needed?',
    position: [340, 120],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.retry }}'), operator: { type: 'boolean', operation: 'true' }, rightValue: '' }],
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

const prepareRetry = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Retry',
    position: [780, 220],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return [{ json: { stub: true } }]" }
  },
  output: [{ request: { model: 'claude-opus-5' }, stripThinking: false }]
});

const callClaudeRetry = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Call Claude (retry)',
    position: [1000, 220],
    credentials: { httpTemplatedCustomAuth: newCredential('Anthropic API (x-api-key)') },
    parameters: {
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'anthropic-version', value: '2023-06-01' },
          { name: 'anthropic-beta', value: 'server-side-fallback-2026-07-01' },
          { name: 'content-type', value: 'application/json' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ JSON.stringify($json.request) }}'),
      options: { timeout: 90000, response: { response: { fullResponse: true, neverError: true } } }
    }
  },
  output: [{ statusCode: 200, body: { content: [], stop_reason: 'end_turn' } }]
});

const shapeReplyFinal = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Shape Reply (final)',
    position: [1220, 220],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return [{ json: { stub: true } }]" }
  },
  output: [{ retry: false, ok: true, reply: '…', actions: [] }]
});

const respondAssistant = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Browser',
    position: [1440, 0],
    parameters: {
      respondWith: 'json',
      responseBody: expr('={{ JSON.stringify({ ok: $json.ok, reply: $json.reply, actions: $json.actions || [], assistantContent: $json.assistantContent || null, stripThinkingFromHistory: $json.stripThinkingFromHistory === true, meta: $json.meta || null }) }}'),
      options: { responseCode: 200 }
    }
  },
  output: [{ ok: true, shouldLog: true, sessionId: 'ba0d…', logEvent: { event: 'open_quote_form', products: 'desiccant', summary: 'Desiccant for LLDPE blown film, 25-100 t/yr' } }]
});

const shouldLog = ifElse({
  version: 2.3,
  config: {
    name: 'Conversion Event?',
    position: [1660, 0],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.shouldLog }}'), operator: { type: 'boolean', operation: 'true' }, rightValue: '' }],
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
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets — Pure Polymers') },
    parameters: {
      resource: 'sheet',
      operation: 'append',
      documentId: { __rl: true, mode: 'list', value: '', cachedResultName: 'Pure Polymers — Quote Requests (Master)' },
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
        schema: [{ id: 'timestamp', displayName: 'timestamp', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'session_id', displayName: 'session_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'event', displayName: 'event', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'reason', displayName: 'reason', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'urgency', displayName: 'urgency', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'products', displayName: 'products', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'polymers', displayName: 'polymers', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'process', displayName: 'process', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'volume', displayName: 'volume', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'timeline', displayName: 'timeline', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'summary', displayName: 'summary', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }]
      },
      options: {}
    }
  },
  output: [{ timestamp: '2026-09-20T09:00:00.000Z' }]
});

const assistantNote = sticky("## A · AI Assistant backend (Claude)\nPOST /webhook/pure-polymers/assistant → { reply, actions, assistantContent }\n\nStateless by design: the browser owns the conversation and replays it append-only, so thinking-block signatures stay valid and the cached system prefix (prompt + tools, ~10.6k tokens) keeps hitting.\n\nThe Guard node validates the transcript structure but never rewrites it — an invalid history gets a deterministic WhatsApp handoff instead of a repaired transcript.\nOne bounded retry covers 429/5xx and a thinking-signature rejection (strip thinking blocks once, then tell the browser to drop them too).\n\nSetup: create a \"Custom Auth (templated)\" credential named \"Anthropic API (x-api-key)\" with the template {\"headers\":{\"x-api-key\":\"{{api_key}}\"}} and your Anthropic key as api_key.", [assistantWebhook, guard, blocked], { color: 5 });

export default workflow('pp-a-assistant', 'Pure Polymers — A — AI Assistant')
  .add(assistantWebhook)
  .to(guard)
  .to(
    blocked
      .onTrue(respondAssistant)
      .onFalse(callClaude.to(shapeReply).to(needsRetry.onFalse(respondAssistant).onTrue(waitBeforeRetry.to(prepareRetry.to(callClaudeRetry.to(shapeReplyFinal.to(respondAssistant)))))))
  )
  .add(respondAssistant)
  .to(shouldLog.onTrue(logEvent))
  .add(assistantNote);
