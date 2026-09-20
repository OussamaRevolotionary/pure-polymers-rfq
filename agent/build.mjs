// Generates the agent artifacts from the product catalog (single source of truth).
//   node agent/build.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { API, MODEL, buildRequestTemplate, openAiTools } from './src/request.mjs'
import { buildSystemPrompt } from './src/systemPrompt.mjs'
import { TOOLS } from './src/tools.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, 'dist')
mkdirSync(dist, { recursive: true })

const prompt = buildSystemPrompt()
writeFileSync(join(dist, 'system-prompt.md'), prompt + '\n')
writeFileSync(join(dist, 'tools.json'), JSON.stringify(TOOLS, null, 2) + '\n')
writeFileSync(join(dist, 'tools.openai.json'), JSON.stringify(openAiTools(), null, 2) + '\n')

const template = buildRequestTemplate()
const example = {
  ...template,
  messages: [
    { role: 'system', content: '<see system-prompt.md>' },
    { role: 'user', content: 'We get fish-eyes in recycled LLDPE film. What fixes it?' },
    {
      role: 'assistant',
      content: 'That pattern usually points to moisture carried in with the regrind…',
      tool_calls: [
        {
          id: 'call_01',
          type: 'function',
          function: { name: 'show_product_cards', arguments: '{"product_ids":["desiccant"],"headline":"Fixes moisture defects in recycled film"}' },
        },
      ],
    },
    { role: 'tool', tool_call_id: 'call_01', content: 'Product cards with verified catalog data were displayed to the user.' },
    { role: 'user', content: 'LLDPE blown film, about 5 tons a month.' },
  ],
}
writeFileSync(
  join(dist, 'request.example.json'),
  JSON.stringify({ endpoint: API.url, credential: `n8n predefined credential type: ${API.credentialType}`, body: example }, null, 2) + '\n',
)

const approxTokens = Math.round(prompt.length / 3.6)
const stats = {
  model: MODEL,
  characters: prompt.length,
  approxTokens,
  tools: TOOLS.map((t) => t.name),
  generatedAt: new Date().toISOString(),
}
writeFileSync(join(dist, 'prompt-stats.json'), JSON.stringify(stats, null, 2) + '\n')
console.log(`agent/dist written — ${MODEL}, system prompt ${prompt.length} chars (~${approxTokens} tokens), ${TOOLS.length} tools`)
