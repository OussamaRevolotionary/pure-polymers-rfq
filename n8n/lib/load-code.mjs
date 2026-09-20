import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TOOLS } from '../../agent/src/tools.mjs'
import { buildSystemPrompt } from '../../agent/src/systemPrompt.mjs'

const codeDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'code')

/**
 * Reads a Code-node source and resolves the two build-time directives, so the
 * string used in tests is byte-identical to the one embedded in the workflow:
 *   // @include <path>          → inlines a shared helper file
 *   // @inject SYSTEM_PROMPT    → the generated Claude system prompt
 *   // @inject TOOLS            → the generated tool schemas
 */
export function loadCode(relativePath, replacements = {}) {
  // Normalise CRLF so the embedded code is identical on Windows and Linux.
  let source = readFileSync(join(codeDir, relativePath), 'utf8').split('\r\n').join('\n')
  source = source.replace(/^\s*\/\/ @include (.+)$/gm, (_, target) =>
    readFileSync(join(codeDir, target.trim()), 'utf8').replace(/^\/\* @shared.*\*\/\n/, ''),
  )
  source = source.replace(/^\s*\/\/ @inject SYSTEM_PROMPT$/gm, () => {
    const prompt = buildSystemPrompt()
    /* A template literal keeps the prompt readable - and diffable in git - inside the
       workflow JSON, instead of one 38 kB line of escape sequences. Safe only while the
       prompt contains no backtick, backslash or template placeholder. */
    const templateSafe = !/[`\\]/.test(prompt) && !prompt.includes('${')
    return `const SYSTEM_PROMPT = ${templateSafe ? '`' + prompt + '`' : JSON.stringify(prompt)}`
  })
  source = source.replace(/^\s*\/\/ @inject TOOLS$/gm, () => `const TOOLS = ${JSON.stringify(TOOLS)}`)
  for (const [token, value] of Object.entries(replacements)) source = source.split(token).join(value)
  return source
}
