/* @shared email-kit — inlined into Code nodes by n8n/build.mjs (Code nodes cannot import). */

const BRAND = {
  ink: '#0B0F14',
  ink2: '#151b23',
  paper: '#F5F7FA',
  line: '#dfe4ea',
  text: '#1d242e',
  muted: '#5d6875',
  green: '#509C35',
  lime: '#BECC30',
  blue: '#3249B3',
  amber: '#E09A2D',
  whatsapp: '#1ea952',
}

function esc(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function row(label, value) {
  if (!value) return ''
  return (
    '<tr>' +
    '<td style="padding:6px 12px 6px 0;font:12px Arial,sans-serif;color:' + BRAND.muted + ';white-space:nowrap;vertical-align:top;">' + esc(label) + '</td>' +
    '<td style="padding:6px 0;font:13px Arial,sans-serif;color:' + BRAND.text + ';vertical-align:top;">' + esc(value) + '</td>' +
    '</tr>'
  )
}

function table(rows) {
  const body = rows.filter(Boolean).join('')
  return body ? '<table role="presentation" cellpadding="0" cellspacing="0" width="100%">' + body + '</table>' : ''
}

function sectionTitle(text) {
  return '<p style="margin:22px 0 8px;font:600 10px/1.4 Consolas,Menlo,monospace;letter-spacing:2px;text-transform:uppercase;color:' + BRAND.muted + ';">' + esc(text) + '</p>'
}

function button(href, label, background, color) {
  return (
    '<a href="' + esc(href) + '" style="display:inline-block;background:' + background + ';color:' + (color || '#ffffff') +
    ';font:600 14px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:8px;">' + esc(label) + '</a>'
  )
}

function preheader(text) {
  return '<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:' + BRAND.paper + ';">' + esc(text) + '</div>'
}

/** 600px branded shell used by every outbound email. */
function shell(options) {
  return (
    '<div style="background:' + BRAND.paper + ';padding:24px 12px;">' +
    preheader(options.preheader || '') +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid ' + BRAND.line + ';border-radius:14px;overflow:hidden;">' +
    '<tr><td style="background:' + BRAND.ink + ';padding:18px 26px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="font:700 18px Arial,sans-serif;color:#ffffff;">Pure Polymers' +
    '<div style="font:italic 600 11px Arial,sans-serif;color:' + BRAND.lime + ';padding-top:3px;">Real Passion for Quality</div></td>' +
    '<td align="right" style="font:600 11px Consolas,Menlo,monospace;color:' + BRAND.lime + ';letter-spacing:1px;">' + esc(options.badge || '') + '</td>' +
    '</tr></table></td></tr>' +
    '<tr><td style="height:4px;background:linear-gradient(90deg,' + BRAND.green + ',' + BRAND.lime + ',' + BRAND.blue + ');font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '<tr><td style="padding:26px;">' + options.body + '</td></tr>' +
    '<tr><td style="background:#f2f4f7;padding:16px 26px;font:12px Arial,sans-serif;color:' + BRAND.muted + ';">' + options.footer + '</td></tr>' +
    '</table></div>'
  )
}

function waLink(phoneDigits, text) {
  return 'https://wa.me/' + phoneDigits + (text ? '?text=' + encodeURIComponent(text) : '')
}
