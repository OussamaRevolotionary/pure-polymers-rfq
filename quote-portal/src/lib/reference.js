function randomUint32() {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0]
}

/**
 * Human-friendly reference shown to the buyer and used by sales on the phone,
 * e.g. PP-8942-CM. It is NOT the primary key — `submissionId` is — so a rare
 * collision on the 4 digits never merges two leads.
 */
export function generateReference(familyCode) {
  const digits = 1000 + (randomUint32() % 9000)
  return `PP-${digits}-${familyCode}`
}

export function uuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
