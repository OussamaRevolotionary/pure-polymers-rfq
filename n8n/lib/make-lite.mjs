// Emits sdk/lite/*.ts — the same graphs with Code-node bodies stubbed, so the
// n8n MCP validator can check node parameters without 60 kB of inlined JS.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const sdkDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'sdk')
mkdirSync(join(sdkDir, 'lite'), { recursive: true })

const STRING_LITERAL = /jsCode: "(?:[^"\\]|\\.)*"/g

for (const name of ['pp-b-quote-intake', 'pp-a-assistant', 'pp-c-sla-watchdog']) {
  const source = readFileSync(join(sdkDir, `${name}.workflow.ts`), 'utf8')
  const lite = source.replace(STRING_LITERAL, (match) =>
    match.length > 400 ? 'jsCode: "return [{ json: { stub: true } }]"' : match,
  )
  writeFileSync(join(sdkDir, 'lite', `${name}.ts`), lite)
  console.log(`${name}: ${source.length} → ${lite.length}`)
}
