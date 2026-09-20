/**
 * Code node · "Resolve TDS Files" (run once for all items)
 * In : rows of the TDS_Library sheet tab (may be empty, or one error item)
 * Out: exactly one item { hasTds, tdsFiles[], missing[] } — never zero items, so the
 *      buyer confirmation always goes out even when no data sheet is on file.
 */

const v = $('Validate & Normalize').first().json
const rows = $input
  .all()
  .map((item) => item.json)
  .filter((r) => r && r.product_id && r.tds_file_id)

const byProduct = {}
for (const r of rows) {
  byProduct[String(r.product_id).trim()] = r
}

const tdsFiles = []
const missing = []
for (const product of v.lead.products) {
  const match = byProduct[product.id]
  if (match) {
    tdsFiles.push({
      productId: product.id,
      productName: product.name,
      fileId: String(match.tds_file_id).trim(),
      fileName: String(match.tds_file_name || 'TDS - ' + product.name + '.pdf').trim(),
      version: String(match.version || '').trim(),
    })
  } else {
    missing.push(product.name)
  }
}

return [{ json: { hasTds: tdsFiles.length > 0, tdsFiles, missing } }]
