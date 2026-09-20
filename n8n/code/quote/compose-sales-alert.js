/**
 * Code node · "Compose Sales Alert" (run once for all items)
 * In : the executed route Set node (Switch branch)
 * Out: one item { to, cc, subject, html } for the internal Gmail node
 */

// @include shared/email-kit.js

const v = $('Validate & Normalize').first().json
const lead = v.lead
const config = v.config

// Exactly one Switch branch runs per execution; find which route Set node fired.
const ROUTE_NODES = ['Route · Color Lab', 'Route · Additives Desk', 'Route · Compounding Team', 'Route · Sales Triage']
let route = null
for (const name of ROUTE_NODES) {
  try {
    if ($(name).isExecuted) {
      route = $(name).first().json
      break
    }
  } catch (error) {
    // node not part of this execution path
  }
}
if (!route) route = { route_team: lead.team, route_recipients: config.opsRecipient, route_variant: 'triage', route_focus: '' }

const tierStyle = { HOT: { emoji: '🔥', color: '#c2410c' }, WARM: { emoji: '🟡', color: '#a16207' }, NURTURE: { emoji: '⚪', color: BRAND.muted } }[lead.tier]
const productNames = lead.products.map((p) => p.name).join(' + ')

const replyBody =
  'Dear ' + lead.contact.firstName + ',%0D%0A%0D%0AThank you for your request ' + lead.reference + '.%0D%0A%0D%0A'
const mailto =
  'mailto:' + lead.contact.email +
  '?subject=' + encodeURIComponent('Pure Polymers quotation ' + lead.reference + ' — ' + productNames) +
  '&body=' + replyBody
const waText =
  'Hello ' + lead.contact.firstName + ', this is Pure Polymers (Modon 3, Jeddah) about your quote request ' +
  lead.reference + ' for ' + productNames + '.'

const specBlocks = lead.products
  .map(
    (p) =>
      '<div style="border:1px solid ' + BRAND.line + ';border-radius:10px;padding:12px 14px;margin-bottom:10px;">' +
      '<div style="font:600 14px Arial,sans-serif;color:' + BRAND.text + ';">' + esc(p.name) + '</div>' +
      table(p.specs.map((r) => row(r.label, r.value))) +
      '</div>',
  )
  .join('')

const body =
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
  '<td style="font:700 22px Arial,sans-serif;color:' + BRAND.text + ';">' + tierStyle.emoji + ' ' + esc(lead.tier) +
  ' lead · <span style="font-family:Consolas,Menlo,monospace;">' + esc(lead.reference) + '</span></td>' +
  '<td align="right" style="font:600 12px Arial,sans-serif;color:' + tierStyle.color + ';">score ' + lead.score + '/100</td>' +
  '</tr></table>' +
  '<p style="margin:6px 0 0;font:13px Arial,sans-serif;color:' + BRAND.muted + ';">' +
  esc(route.route_team) + ' · received ' + esc(lead.receivedAtLocal) +
  ' · <strong style="color:' + BRAND.text + ';">quotation due ' + esc(lead.slaDueLocal) + '</strong></p>' +
  (route.route_focus
    ? '<p style="margin:14px 0 0;padding:10px 12px;background:#f2f7ef;border-left:3px solid ' + BRAND.green +
      ';font:13px Arial,sans-serif;color:' + BRAND.text + ';">' + esc(route.route_focus) + '</p>'
    : '') +
  sectionTitle('Buyer') +
  table([
    row('Company', lead.contact.company),
    row('Contact', lead.contact.fullName + (lead.contact.role ? ' · ' + lead.contact.role : '')),
    row('Email', lead.contact.email),
    row('Phone', lead.contact.phone + (lead.contact.whatsapp ? ' (WhatsApp)' : '')),
    row('Prefers', lead.contact.channel + ' · replies in ' + (lead.contact.language === 'ar' ? 'Arabic' : 'English')),
    row('Email type', lead.contact.businessEmail ? 'Company domain' : 'Free mailbox'),
  ]) +
  sectionTitle('Technical request') +
  specBlocks +
  table([
    row('Base polymer', lead.application.polymers),
    row('Process', lead.application.process),
    row('End market', lead.application.market),
    row('Final product', lead.application.finalProduct),
  ]) +
  sectionTitle('Commercial') +
  table([
    row('Annual volume', lead.commercial.annualVolume),
    row('First order', lead.commercial.firstOrder),
    row('Timeline', lead.commercial.timeline),
    row('Lab sample first', lead.commercial.sampleRequested ? 'Yes — ships within 7 business days' : 'No'),
    row('Delivery', [lead.commercial.city, lead.commercial.country].filter(Boolean).join(', ')),
    row('Incoterm', lead.commercial.incoterm),
    row('Target price', lead.commercial.targetPrice),
    row('Grade used today', lead.commercial.benchmark),
  ]) +
  (lead.notes
    ? sectionTitle('Notes from the buyer') +
      '<p style="margin:0;font:13px/1.6 Arial,sans-serif;color:' + BRAND.text + ';white-space:pre-line;">' + esc(lead.notes) + '</p>'
    : '') +
  '<div style="margin:24px 0 6px;">' +
  button(mailto, 'Reply by email', BRAND.green) + '&nbsp;&nbsp;' +
  (lead.contact.phoneDigits ? button(waLink(lead.contact.phoneDigits, waText), 'WhatsApp the buyer', BRAND.whatsapp) + '&nbsp;&nbsp;' : '') +
  button(config.quoteLogUrl, 'Open quote log', BRAND.ink) +
  '</div>' +
  sectionTitle('Source') +
  table([
    row('Page', lead.source.page),
    row('Campaign', lead.source.utm),
    row('Prefilled by', lead.source.prefilledBy === 'assistant' ? 'AI assistant conversation' : ''),
    row('Submission id', lead.submissionId),
  ])

const html = shell({
  badge: 'NEW QUOTE REQUEST',
  preheader: lead.tier + ' · ' + productNames + ' · ' + (lead.commercial.annualVolume || 'volume not given') + ' · ' + lead.contact.company,
  body,
  footer: 'Automated by the Pure Polymers quote pipeline · reply directly to the buyer, then set the row status in the quote log.',
})

return [
  {
    json: {
      to: config.mode === 'live' ? route.route_recipients : config.demoRecipient,
      cc: config.mode === 'live' ? route.route_cc || '' : '',
      // Demo mode bcc's us so we see the alert Fahad sees without appearing on his copy.
      bcc: config.mode === 'live' ? '' : config.demoBcc || '',
      subject:
        tierStyle.emoji + ' ' + lead.tier + ' · ' + lead.reference + ' · ' + productNames + ' · ' +
        (lead.commercial.annualVolume || 'volume TBC') + ' · ' + lead.contact.company,
      html,
      tier: lead.tier,
      reference: lead.reference,
      pingText:
        lead.tier + ' quote request ' + lead.reference + ': ' + productNames + ' for ' + lead.contact.company +
        ' (' + (lead.commercial.annualVolume || 'volume TBC') + '). Quotation due ' + lead.slaDueLocal + '.',
    },
  },
]
