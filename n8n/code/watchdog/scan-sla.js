/**
 * Code node · "Scan SLA & Build Digest" (run once for all items)
 * In : every row of the master quote log
 * Out: zero items when nothing needs attention (the workflow then ends silently),
 *      otherwise one item { subject, html } for the escalation email.
 */

// @include shared/email-kit.js

const CONFIG = {
  mode: 'pilot',
  // Overdue-quote chasing stays internal while this is a demo: an unexpected
  // "still unanswered" email days later would read as nagging, not as a feature.
  opsRecipient: 'oussama.g@oussamalabs.com',
  salesRecipient: 'fahad@purepolymers.net',
  quoteLogUrl: 'https://docs.google.com/spreadsheets/d/1DUd4fQiYWlL86c7_Io0GjQ2oM6u8vcK99Bkw9xXs3ks/edit',
  openStatuses: ['New', 'In review'],
  digestHourRiyadh: 8,
}

const rows = $input.all().map((item) => item.json).filter((r) => r && r.reference)
const now = Date.now()
const riyadhHour = Number(
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', hour12: false }).format(new Date(now)),
)

const isOpen = (r) => CONFIG.openStatuses.indexOf(String(r.status || '').trim()) !== -1
const parse = (value) => {
  const t = Date.parse(value)
  return Number.isNaN(t) ? null : t
}

const overdue = rows.filter((r) => {
  const due = parse(r.sla_due_at)
  return isOpen(r) && due !== null && due < now
})
const last24h = rows.filter((r) => {
  const received = parse(r.received_at)
  return received !== null && now - received <= 86400000
})

const isDigestRun = riyadhHour === CONFIG.digestHourRiyadh
if (!overdue.length && !(isDigestRun && last24h.length)) return []

const hoursLate = (r) => Math.round((now - parse(r.sla_due_at)) / 3600000)
const tableRows = (list, late) =>
  list
    .map(
      (r) =>
        '<tr>' +
        '<td style="padding:8px 10px 8px 0;font:600 12px Consolas,Menlo,monospace;color:' + (late ? '#b91c1c' : BRAND.green) + ';white-space:nowrap;vertical-align:top;">' +
        esc(r.reference) + (late ? '<br><span style="font-weight:400;color:' + BRAND.muted + ';">' + hoursLate(r) + ' h late</span>' : '') + '</td>' +
        '<td style="padding:8px 10px 8px 0;font:13px Arial,sans-serif;color:' + BRAND.text + ';vertical-align:top;">' +
        '<strong>' + esc(r.company) + '</strong><br><span style="color:' + BRAND.muted + ';font-size:12px;">' + esc(r.products) + '</span></td>' +
        '<td style="padding:8px 10px 8px 0;font:12px Arial,sans-serif;color:' + BRAND.muted + ';vertical-align:top;">' + esc(r.annual_volume) + '<br>' + esc(r.team) + '</td>' +
        '<td style="padding:8px 0;font:12px Arial,sans-serif;color:' + BRAND.muted + ';vertical-align:top;">' + esc(r.tier) + '</td>' +
        '</tr>',
    )
    .join('')

const head =
  '<tr>' +
  ['Reference', 'Buyer', 'Volume / team', 'Tier']
    .map((h) => '<th align="left" style="padding:0 10px 6px 0;font:600 10px Consolas,Menlo,monospace;letter-spacing:2px;text-transform:uppercase;color:' + BRAND.muted + ';border-bottom:1px solid ' + BRAND.line + ';">' + h + '</th>')
    .join('') +
  '</tr>'

let body = ''
if (overdue.length) {
  body +=
    '<p style="margin:0 0 6px;font:700 20px Arial,sans-serif;color:#b91c1c;">' + overdue.length +
    ' quotation' + (overdue.length > 1 ? 's are' : ' is') + ' past the promised reply time</p>' +
    '<p style="margin:0 0 14px;font:13px Arial,sans-serif;color:' + BRAND.muted + ';">The buyer was told they would have a formal quotation by the date below. Send it or update the row status.</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + head + tableRows(overdue, true) + '</table>'
}
if (isDigestRun && last24h.length) {
  body +=
    (overdue.length ? '<div style="height:26px;"></div>' : '') +
    sectionTitle('New in the last 24 hours (' + last24h.length + ')') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + head + tableRows(last24h, false) + '</table>'
}
body += '<div style="margin:24px 0 0;">' + button(CONFIG.quoteLogUrl, 'Open the quote log', BRAND.ink) + '</div>'

const html = shell({
  badge: overdue.length ? 'SLA ESCALATION' : 'DAILY DIGEST',
  preheader: overdue.length ? overdue.length + ' quote request(s) past due' : last24h.length + ' new quote request(s) in 24 h',
  body,
  footer: 'Runs Sunday–Thursday at 08:00, 12:00 and 16:00 Asia/Riyadh · silent when nothing is overdue.',
})

return [
  {
    json: {
      to: CONFIG.mode === 'live' ? CONFIG.salesRecipient : CONFIG.opsRecipient,
      subject: overdue.length
        ? '⏰ ' + overdue.length + ' Pure Polymers quotation(s) past due'
        : 'Pure Polymers — ' + last24h.length + ' new quote request(s) in the last 24 h',
      html,
      overdueCount: overdue.length,
      newCount: last24h.length,
    },
  },
]
