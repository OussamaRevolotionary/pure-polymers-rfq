/**
 * Minimal stand-in for the n8n Code-node runtime: the globals a node may touch
 * ($input, $(), $now) and nothing else. Enough to run the real node sources
 * outside n8n and catch the bugs that would otherwise surface in production.
 */
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

const wrap = (items) => ({
  all: () => items,
  first: () => items[0],
  last: () => items[items.length - 1],
  item: items[0],
})

export async function runCodeNode(source, { input = [{ json: {} }], nodes = {} } = {}) {
  const nodeAccessor = (name) => {
    if (!(name in nodes)) {
      const error = new Error(`No node called "${name}" in this execution`)
      error.name = 'NodeOperationError'
      throw error
    }
    const entry = nodes[name]
    const items = Array.isArray(entry.items) ? entry.items : [{ json: entry.json ?? {} }]
    return { ...wrap(items), isExecuted: entry.isExecuted !== false }
  }
  const $now = { toISO: () => new Date().toISOString() }
  const fn = new AsyncFunction('$input', '$', '$now', 'console', source)
  return fn(wrap(input), nodeAccessor, $now, console)
}

export function assert(condition, message) {
  if (!condition) throw new Error('Assertion failed: ' + message)
  process.stdout.write('  ✓ ' + message + '\n')
}

export function section(title) {
  process.stdout.write('\n' + title + '\n')
}
