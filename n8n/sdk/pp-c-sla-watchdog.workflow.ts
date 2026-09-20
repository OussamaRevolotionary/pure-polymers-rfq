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
    credentials: { googleSheetsOAuth2Api: newCredential("Google Sheets oussama19", "4skWlyOrFj84KJxt") },
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
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "/**\n * Code node · \"Scan SLA & Build Digest\" (run once for all items)\n * In : every row of the master quote log\n * Out: zero items when nothing needs attention (the workflow then ends silently),\n *      otherwise one item { subject, html } for the escalation email.\n */\n\nconst BRAND = {\n  ink: '#0B0F14',\n  ink2: '#151b23',\n  paper: '#F5F7FA',\n  line: '#dfe4ea',\n  text: '#1d242e',\n  muted: '#5d6875',\n  green: '#509C35',\n  lime: '#BECC30',\n  blue: '#3249B3',\n  amber: '#E09A2D',\n  whatsapp: '#1ea952',\n}\n\nfunction esc(value) {\n  return String(value === undefined || value === null ? '' : value)\n    .replace(/&/g, '&amp;')\n    .replace(/</g, '&lt;')\n    .replace(/>/g, '&gt;')\n    .replace(/\"/g, '&quot;')\n}\n\nfunction row(label, value) {\n  if (!value) return ''\n  return (\n    '<tr>' +\n    '<td style=\"padding:6px 12px 6px 0;font:12px Arial,sans-serif;color:' + BRAND.muted + ';white-space:nowrap;vertical-align:top;\">' + esc(label) + '</td>' +\n    '<td style=\"padding:6px 0;font:13px Arial,sans-serif;color:' + BRAND.text + ';vertical-align:top;\">' + esc(value) + '</td>' +\n    '</tr>'\n  )\n}\n\nfunction table(rows) {\n  const body = rows.filter(Boolean).join('')\n  return body ? '<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">' + body + '</table>' : ''\n}\n\nfunction sectionTitle(text) {\n  return '<p style=\"margin:22px 0 8px;font:600 10px/1.4 Consolas,Menlo,monospace;letter-spacing:2px;text-transform:uppercase;color:' + BRAND.muted + ';\">' + esc(text) + '</p>'\n}\n\nfunction button(href, label, background, color) {\n  return (\n    '<a href=\"' + esc(href) + '\" style=\"display:inline-block;background:' + background + ';color:' + (color || '#ffffff') +\n    ';font:600 14px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:8px;\">' + esc(label) + '</a>'\n  )\n}\n\nfunction preheader(text) {\n  return '<div style=\"display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:' + BRAND.paper + ';\">' + esc(text) + '</div>'\n}\n\n/** 600px branded shell used by every outbound email. */\nfunction shell(options) {\n  return (\n    '<div style=\"background:' + BRAND.paper + ';padding:24px 12px;\">' +\n    preheader(options.preheader || '') +\n    '<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;margin:0 auto;background:#ffffff;border:1px solid ' + BRAND.line + ';border-radius:14px;overflow:hidden;\">' +\n    '<tr><td style=\"background:' + BRAND.ink + ';padding:18px 26px;\">' +\n    '<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>' +\n    '<td style=\"font:700 18px Arial,sans-serif;color:#ffffff;\">Pure Polymers' +\n    '<div style=\"font:italic 600 11px Arial,sans-serif;color:' + BRAND.lime + ';padding-top:3px;\">Real Passion for Quality</div></td>' +\n    '<td align=\"right\" style=\"font:600 11px Consolas,Menlo,monospace;color:' + BRAND.lime + ';letter-spacing:1px;\">' + esc(options.badge || '') + '</td>' +\n    '</tr></table></td></tr>' +\n    '<tr><td style=\"height:4px;background:linear-gradient(90deg,' + BRAND.green + ',' + BRAND.lime + ',' + BRAND.blue + ');font-size:0;line-height:0;\">&nbsp;</td></tr>' +\n    '<tr><td style=\"padding:26px;\">' + options.body + '</td></tr>' +\n    '<tr><td style=\"background:#f2f4f7;padding:16px 26px;font:12px Arial,sans-serif;color:' + BRAND.muted + ';\">' + options.footer + '</td></tr>' +\n    '</table></div>'\n  )\n}\n\nfunction waLink(phoneDigits, text) {\n  return 'https://wa.me/' + phoneDigits + (text ? '?text=' + encodeURIComponent(text) : '')\n}\n\n\nconst CONFIG = {\n  mode: 'pilot',\n  // Overdue-quote chasing stays internal while this is a demo: an unexpected\n  // \"still unanswered\" email days later would read as nagging, not as a feature.\n  opsRecipient: 'oussama.g@oussamalabs.com',\n  salesRecipient: 'fahad@purepolymers.net',\n  quoteLogUrl: 'https://docs.google.com/spreadsheets/d/1DUd4fQiYWlL86c7_Io0GjQ2oM6u8vcK99Bkw9xXs3ks/edit',\n  openStatuses: ['New', 'In review'],\n  digestHourRiyadh: 8,\n}\n\nconst rows = $input.all().map((item) => item.json).filter((r) => r && r.reference)\nconst now = Date.now()\nconst riyadhHour = Number(\n  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', hour12: false }).format(new Date(now)),\n)\n\nconst isOpen = (r) => CONFIG.openStatuses.indexOf(String(r.status || '').trim()) !== -1\nconst parse = (value) => {\n  const t = Date.parse(value)\n  return Number.isNaN(t) ? null : t\n}\n\nconst overdue = rows.filter((r) => {\n  const due = parse(r.sla_due_at)\n  return isOpen(r) && due !== null && due < now\n})\nconst last24h = rows.filter((r) => {\n  const received = parse(r.received_at)\n  return received !== null && now - received <= 86400000\n})\n\nconst isDigestRun = riyadhHour === CONFIG.digestHourRiyadh\nif (!overdue.length && !(isDigestRun && last24h.length)) return []\n\nconst hoursLate = (r) => Math.round((now - parse(r.sla_due_at)) / 3600000)\nconst tableRows = (list, late) =>\n  list\n    .map(\n      (r) =>\n        '<tr>' +\n        '<td style=\"padding:8px 10px 8px 0;font:600 12px Consolas,Menlo,monospace;color:' + (late ? '#b91c1c' : BRAND.green) + ';white-space:nowrap;vertical-align:top;\">' +\n        esc(r.reference) + (late ? '<br><span style=\"font-weight:400;color:' + BRAND.muted + ';\">' + hoursLate(r) + ' h late</span>' : '') + '</td>' +\n        '<td style=\"padding:8px 10px 8px 0;font:13px Arial,sans-serif;color:' + BRAND.text + ';vertical-align:top;\">' +\n        '<strong>' + esc(r.company) + '</strong><br><span style=\"color:' + BRAND.muted + ';font-size:12px;\">' + esc(r.products) + '</span></td>' +\n        '<td style=\"padding:8px 10px 8px 0;font:12px Arial,sans-serif;color:' + BRAND.muted + ';vertical-align:top;\">' + esc(r.annual_volume) + '<br>' + esc(r.team) + '</td>' +\n        '<td style=\"padding:8px 0;font:12px Arial,sans-serif;color:' + BRAND.muted + ';vertical-align:top;\">' + esc(r.tier) + '</td>' +\n        '</tr>',\n    )\n    .join('')\n\nconst head =\n  '<tr>' +\n  ['Reference', 'Buyer', 'Volume / team', 'Tier']\n    .map((h) => '<th align=\"left\" style=\"padding:0 10px 6px 0;font:600 10px Consolas,Menlo,monospace;letter-spacing:2px;text-transform:uppercase;color:' + BRAND.muted + ';border-bottom:1px solid ' + BRAND.line + ';\">' + h + '</th>')\n    .join('') +\n  '</tr>'\n\nlet body = ''\nif (overdue.length) {\n  body +=\n    '<p style=\"margin:0 0 6px;font:700 20px Arial,sans-serif;color:#b91c1c;\">' + overdue.length +\n    ' quotation' + (overdue.length > 1 ? 's are' : ' is') + ' past the promised reply time</p>' +\n    '<p style=\"margin:0 0 14px;font:13px Arial,sans-serif;color:' + BRAND.muted + ';\">The buyer was told they would have a formal quotation by the date below. Send it or update the row status.</p>' +\n    '<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">' + head + tableRows(overdue, true) + '</table>'\n}\nif (isDigestRun && last24h.length) {\n  body +=\n    (overdue.length ? '<div style=\"height:26px;\"></div>' : '') +\n    sectionTitle('New in the last 24 hours (' + last24h.length + ')') +\n    '<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">' + head + tableRows(last24h, false) + '</table>'\n}\nbody += '<div style=\"margin:24px 0 0;\">' + button(CONFIG.quoteLogUrl, 'Open the quote log', BRAND.ink) + '</div>'\n\nconst html = shell({\n  badge: overdue.length ? 'SLA ESCALATION' : 'DAILY DIGEST',\n  preheader: overdue.length ? overdue.length + ' quote request(s) past due' : last24h.length + ' new quote request(s) in 24 h',\n  body,\n  footer: 'Runs Sunday–Thursday at 08:00, 12:00 and 16:00 Asia/Riyadh · silent when nothing is overdue.',\n})\n\nreturn [\n  {\n    json: {\n      to: CONFIG.mode === 'live' ? CONFIG.salesRecipient : CONFIG.opsRecipient,\n      subject: overdue.length\n        ? '⏰ ' + overdue.length + ' Pure Polymers quotation(s) past due'\n        : 'Pure Polymers — ' + last24h.length + ' new quote request(s) in the last 24 h',\n      html,\n      overdueCount: overdue.length,\n      newCount: last24h.length,\n    },\n  },\n]\n" }
  },
  output: [{ to: 'sales@purepolymers.net', subject: '⏰ 2 Pure Polymers quotation(s) past due', html: '<div>…</div>', overdueCount: 2, newCount: 5 }]
});

const sendEscalation = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send SLA Escalation',
    position: [100, 0],
    credentials: { gmailOAuth2: newCredential("oussamalabs", "dOUKyFaNKoqvOG7O") },
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
