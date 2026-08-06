// @ts-check
/**
 * Line-length enforcer: fails if any .ts/.tsx line under src/ exceeds 100 chars.
 * Run: `node check-line-length.mjs`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_LENGTH = 100
const ROOT = fileURLToPath(new URL('.', import.meta.url))
const SRC_DIR = join(ROOT, 'src')

/** @param {string} dir @returns {string[]} */
function walkTsFiles(dir) {
  /** @type {string[]} */
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...walkTsFiles(full))
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      out.push(full)
    }
  }
  return out
}

const files = walkTsFiles(SRC_DIR)
/** @type {{ file: string, line: number, length: number, content: string }[]} */
const violations = []

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((content, idx) => {
    if (content.length > MAX_LENGTH) {
      violations.push({ file: relative(ROOT, file), line: idx + 1, length: content.length, content })
    }
  })
}

if (violations.length > 0) {
  console.error(`\nLine-length check failed: ${violations.length} line(s) exceed ${MAX_LENGTH} chars\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} (${v.length} chars)`)
    console.error(`    ${v.content}`)
  }
  console.error('')
  process.exit(1)
}

console.log(`Line-length check passed: scanned ${files.length} .ts/.tsx file(s), 0 violations.`)
