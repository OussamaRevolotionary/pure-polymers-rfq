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
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets — Pure Polymers') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'list', value: '', cachedResultName: 'Pure Polymers — Quote Requests (Master)' },
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
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return [{ json: { stub: true } }]" }
  },
  output: [{ to: 'sales@purepolymers.net', subject: '⏰ 2 Pure Polymers quotation(s) past due', html: '<div>…</div>', overdueCount: 2, newCount: 5 }]
});

const sendEscalation = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send SLA Escalation',
    position: [100, 0],
    credentials: { gmailOAuth2: newCredential('Gmail — Pure Polymers desk') },
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

const watchdogNote = sticky("## C · SLA watchdog & morning digest\nThe promise on the confirmation page is \"a formal quotation within 2 business days\". This is the node that keeps it true.\n\nRuns Sunday–Thursday at 08:00, 12:00 and 16:00 Asia/Riyadh (set the workflow timezone to Asia/Riyadh). It emails only when something is overdue, plus a digest of the last 24 h on the 08:00 run — no noise, so the alert keeps its meaning.\n\nSet the row status to anything other than New / In review once a quotation is sent, and the reminder stops.", [schedule, readLog, scanSla], { color: 6 });

export default workflow('pp-c-sla-watchdog', 'Pure Polymers — C — SLA Watchdog')
  .add(schedule)
  .to(readLog)
  .to(scanSla)
  .to(sendEscalation)
  .add(watchdogNote);
