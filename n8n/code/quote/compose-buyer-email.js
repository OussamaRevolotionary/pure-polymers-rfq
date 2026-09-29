/**
 * Code node · "Bundle TDS & Compose Buyer Email" (run once for all items)
 * In : either the downloaded TDS files (one item per file, binary "data")
 *      or the single no-TDS item straight from "Has TDS on File?"
 * Out: one item { to, subject, html, attachmentProps, hasAttachments } + merged binary
 *
 * This is the anti-ghosting email: reference number, what happens next with a dated
 * promise, the exact spec we received, the TDS, and two ways to reach a human.
 */

// @include shared/email-kit.js

const v = $('Validate & Normalize').first().json
const resolved = $('Resolve TDS Files').first().json
const lead = v.lead
const config = v.config

const ROUTE_NODES = ['Route · Color Lab', 'Route · Additives Desk', 'Route · Compounding Team', 'Route · Sales Triage']
let route = null
for (const name of ROUTE_NODES) {
  try {
    if ($(name).isExecuted) {
      route = $(name).first().json
      break
    }
  } catch (error) {
    // node not on this execution path
  }
}
if (!route) route = { route_team: lead.team, route_variant: 'triage', route_buyer_note: '' }

/* Collect whatever Google Drive actually returned; a failed download simply drops out. */
const binary = {}
const attachedNames = []
const items = $input.all()
items.forEach((item, index) => {
  const data = item.binary && item.binary.data
  if (!data) return
  const file = resolved.tdsFiles[index] || {}
  const key = 'tds_' + index
  binary[key] = Object.assign({}, data, { fileName: file.fileName || data.fileName })
  attachedNames.push(file.productName || file.fileName || data.fileName)
})
const attachmentProps = Object.keys(binary).join(',')

const arabic = lead.contact.language === 'ar'
const visualizerUrl =
  config.visualizerUrl +
  (config.visualizerUrl.indexOf('?') === -1 ? '?' : '&') +
  'ref=' + encodeURIComponent(lead.reference) + '&utm_source=quote-confirmation&utm_medium=email&utm_campaign=quote-next-step'
const waText = 'Hello Pure Polymers, this is a follow-up on quote request ' + lead.reference + ' from ' + lead.contact.company + '.'

const steps = [
  { when: 'Done · ' + lead.receivedAtLocal, title: 'Request received and logged', detail: 'Reference ' + lead.reference + ' is in our quote log.' },
  { when: 'In progress', title: 'Technical review', detail: 'Your specification is with the ' + route.route_team + ' at our Modon 3 plant.' },
  { when: 'By ' + lead.slaDueLocal, title: 'Formal quotation', detail: 'Pricing, dosage recommendation and lead time, by email.' },
  lead.commercial.sampleRequested
    ? { when: 'After your approval', title: 'Lab sample', detail: 'Samples ship within 7 business days so you can validate on your own line.' }
    : null,
].filter(Boolean)

const stepRows = steps
  .map(
    (step) =>
      '<tr>' +
      '<td width="150" style="padding:10px 12px 10px 0;font:600 11px Consolas,Menlo,monospace;color:' + BRAND.green + ';vertical-align:top;white-space:nowrap;">' +
      esc(step.when) + '</td>' +
      '<td style="padding:10px 0;border-left:2px solid ' + BRAND.line + ';padding-left:14px;">' +
      '<div style="font:600 14px Arial,sans-serif;color:' + BRAND.text + ';">' + esc(step.title) + '</div>' +
      '<div style="font:13px Arial,sans-serif;color:' + BRAND.muted + ';padding-top:2px;">' + esc(step.detail) + '</div>' +
      '</td></tr>',
  )
  .join('')

const specBlocks = lead.products
  .map(
    (p) =>
      '<div style="border:1px solid ' + BRAND.line + ';border-radius:10px;padding:12px 14px;margin-bottom:10px;">' +
      '<div style="font:600 14px Arial,sans-serif;color:' + BRAND.text + ';">' + esc(p.name) + '</div>' +
      table(p.specs.map((r) => row(r.label, r.value))) +
      '</div>',
  )
  .join('')

const attachmentLine = attachedNames.length
  ? 'Attached to this email: technical data sheets for ' + attachedNames.join(', ') + '.'
  : 'Your technical data sheet follows from the ' + route.route_team + ' with the quotation.'

// Latin runs inside the Arabic paragraph are isolated and kept on one line: left to
// the bidi algorithm, a reference that wraps at a hyphen comes out as "-PP" / "2939-CM".
const ltr = (text) => '<span dir="ltr" style="white-space:nowrap;">' + esc(text) + '</span>'

const body =
  (arabic
    ? '<p dir="rtl" style="margin:0 0 14px;font:15px/1.7 Arial,sans-serif;color:' + BRAND.text + ';">' +
      'شكراً لتواصلكم مع ' + ltr('Pure Polymers') + '. تم استلام طلب عرض السعر الخاص بكم وتسجيله برقم مرجعي ' + ltr(lead.reference) + '.' +
      '</p>'
    : '') +
  '<p style="margin:0;font:15px/1.6 Arial,sans-serif;color:' + BRAND.text + ';">Dear ' + esc(lead.contact.firstName) + ',</p>' +
  '<p style="margin:10px 0 0;font:15px/1.6 Arial,sans-serif;color:' + BRAND.text + ';">' +
  'Thank you for your quote request. It is logged with our sales desk in Modon 3, Jeddah, and the <strong>' + esc(route.route_team) +
  '</strong> is reviewing your specification now. ' + esc(attachmentLine) + '</p>' +
  '<div style="margin:20px 0;padding:16px 18px;background:#f7f9fb;border:1px solid ' + BRAND.line + ';border-radius:10px;">' +
  '<div style="font:600 10px Consolas,Menlo,monospace;letter-spacing:2px;text-transform:uppercase;color:' + BRAND.muted + ';">Your reference</div>' +
  '<div style="font:700 26px Consolas,Menlo,monospace;color:' + BRAND.ink + ';padding-top:4px;">' + esc(lead.reference) + '</div>' +
  '<div style="font:12px Arial,sans-serif;color:' + BRAND.muted + ';padding-top:6px;">Quote this number on WhatsApp, by phone or by email and we find your full specification instantly.</div>' +
  '</div>' +
  sectionTitle('What happens next') +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + stepRows + '</table>' +
  sectionTitle('The specification we received') +
  specBlocks +
  table([
    row('Base polymer', lead.application.polymers),
    row('Process', lead.application.process),
    row('End market', lead.application.market),
    row('Final product', lead.application.finalProduct),
    row('Annual volume', lead.commercial.annualVolume),
    row('First order', lead.commercial.firstOrder),
    row('Timeline', lead.commercial.timeline),
    row('Delivery', [lead.commercial.city, lead.commercial.country].filter(Boolean).join(', ')),
    row('Incoterm', lead.commercial.incoterm),
  ]) +
  '<div style="margin:24px 0 0;padding:18px;border:1px solid #f0d9ad;border-radius:12px;background:#fdf6e9;">' +
  '<div style="font:600 10px Consolas,Menlo,monospace;letter-spacing:2px;text-transform:uppercase;color:#a1741f;">While our lab prices your inquiry</div>' +
  '<div style="font:700 18px Arial,sans-serif;color:' + BRAND.text + ';padding:6px 0 4px;">See your colors on real products — and take 5% off</div>' +
  '<div style="font:13px/1.6 Arial,sans-serif;color:' + BRAND.muted + ';padding-bottom:14px;">' +
  'Try shades on bags, caps, pipes, cups and more in the Pure Polymers Colors Visualizer. Mention ' + esc(lead.reference) +
  ' and the 5% visualizer offer is noted on your quotation.</div>' +
  button(visualizerUrl, 'Open the Colors Visualizer', BRAND.amber, '#1d242e') +
  '</div>' +
  '<div style="margin:22px 0 0;text-align:center;">' +
  button(waLink(config.whatsappE164, waText), 'Reply on WhatsApp', BRAND.whatsapp) +
  '<div style="font:12px Arial,sans-serif;color:' + BRAND.muted + ';padding-top:10px;">Need to add something? Reply to this email or message the desk on WhatsApp.</div>' +
  '</div>'

const footer =
  '<strong style="color:' + BRAND.text + ';">Pure Polymers for Industries</strong> · Modon 3, Jeddah, Saudi Arabia<br>' +
  '+966 12 663 1575 · +966 54 646 0891 · info@purepolymers.net<br><br>' +
  '<span style="font-size:11px;">PIF Industrial Business Accelerator (2025) · d2w® oxo-biodegradable with Symphony Environmental, SASO 2879 · Italian twin-screw extrusion since 2017</span><br>' +
  '<span style="font-size:11px;">You received this because you requested a quotation on purepolymers.net.</span>'

const html = shell({
  badge: 'QUOTE REQUEST ' + lead.reference,
  preheader: 'Reference ' + lead.reference + ' is logged — quotation by ' + lead.slaDueLocal + '.',
  body,
  footer,
})

return [
  {
    json: {
      to: lead.contact.email,
      replyTo: config.replyTo,
      subject: 'Your quote request ' + lead.reference + ' — ' + lead.products.map((p) => p.name).join(' + '),
      html,
      attachmentProps,
      hasAttachments: attachmentProps !== '',
      attached: attachedNames,
    },
    binary,
    pairedItem: { item: 0 },
  },
]
