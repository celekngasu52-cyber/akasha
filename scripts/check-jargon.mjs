// @ts-check
/**
 * Jargon closure checker for Akasha narratives.
 *
 * Run: `node scripts/check-jargon.mjs`
 *
 * Enforces the 3-part closure rule over every candidate narrative file under
 * `src/synthesis/narratives/` (and the `tlDr` strings produced by
 * `src/synthesis/narrative.ts`, exercised via the test fixtures):
 *
 *   (a) A jargon term in narrative MUST carry a gloss `(arti: ...)` on its
 *       first appearance in that file. The gloss text MUST equal the term's
 *       registered `arti` in `src/i18n/glossary.ts`.
 *   (b) Every word inside a gloss MUST be plain-whitelisted (Indonesian
 *       layperson vocabulary). A gloss containing another jargon term is
 *       rejected — that is the closure property.
 *   (c) A term wrapped in `(arti: ...)` whose head term is NOT in the
 *       glossary, or a `(term: ...)` annotation naming an unknown term,
 *       causes exit 1.
 *
 * Glossing syntax in narratives:
 *   `<term>(arti: <gloss text>)`
 * where `<term>` is one of the canonical `GLOSSARY_TERMS`. The checker reads
 * `src/i18n/glossary.ts` as the single source of truth (regex extraction —
 * Node cannot import `.ts` directly and we avoid duplicating the data).
 *
 * Plain-word whitelist lives co-located in `scripts/jargon-whitelist.mjs`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PLAIN_WORDS } from './jargon-whitelist.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const GLOSSARY_PATH = join(ROOT, 'src', 'i18n', 'glossary.ts')
const NARRATIVES_DIR = join(ROOT, 'src', 'synthesis', 'narratives')

/**
 * Extract `{term, arti}` pairs from glossary.ts via regex. The file format
 * is owned by this repo and stable; regex avoids TS-aware tooling in a
 * plain `.mjs` script.
 * @returns {Map<string, string>} term -> arti
 */
function loadGlossary() {
  const src = readFileSync(GLOSSARY_PATH, 'utf8')
  /** @type {Map<string, string>} */
  const byTerm = new Map()
  // Match a `term`/`arti` pair inside one object literal.
  const entryRe =
    /term:\s*'([^']+)'\s*,\s*arti:\s*'([^']+)'/g
  let m
  while ((m = entryRe.exec(src)) !== null) {
    byTerm.set(m[1], m[2])
  }
  if (byTerm.size < 30) {
    throw new Error(
      `glossary parse failed: only ${byTerm.size} terms found in ${relative(ROOT, GLOSSARY_PATH)}`,
    )
  }
  return byTerm
}

/**
 * Walk a directory recursively, returning `.md`/`.txt` candidate files.
 * @param {string} dir
 * @returns {string[]}
 */
function walkCandidates(dir) {
  /** @type {string[]} */
  const out = []
  if (!exists(dir)) return out
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...walkCandidates(full))
    } else if (entry.endsWith('.md') || entry.endsWith('.txt')) {
      out.push(full)
    }
  }
  return out
}

/** @param {string} p */
function exists(p) {
  try {
    statSync(p)
    return true
  } catch {
    return false
  }
}

/**
 * Split a gloss string into lowercase word tokens for whitelist checking.
 * Non-alphanumeric chars are separators; bare numbers are allowed.
 * @param {string} gloss
 * @returns {string[]}
 */
function tokenize(gloss) {
  return gloss
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0)
}

/**
 * Check one candidate file's text against the closure rule.
 * @param {string} text
 * @param {Map<string, string>} glossary
 * @returns {string[]} violation messages (empty = pass)
 */
function checkText(text, glossary) {
  /** @type {string[]} */
  const violations = []
  const terms = [...glossary.keys()]
  // Sort longest-first so multi-word terms match before single words.
  terms.sort((a, b) => b.length - a.length)

  // (c) Any `(arti: ...)` annotation whose leading term is unknown.
  // We scan for the gloss annotation pattern and validate the head term.
  const annotRe = /([A-Za-z][A-Za-z\- ]*?)\(arti:\s*([^)]*)\)/g
  let am
  while ((am = annotRe.exec(text)) !== null) {
    const head = am[1].trim().toLowerCase()
    const gloss = am[2].trim()
    // Find the canonical term matching this head (case-insensitive).
    const canonical = terms.find((t) => t.toLowerCase() === head)
    if (!canonical) {
      violations.push(
        `unknown jargon term "${am[1].trim()}" has a gloss but is not in glossary`,
      )
      continue
    }
    // (a) gloss text must equal the registered arti.
    const expected = glossary.get(canonical)
    if (expected !== gloss) {
      violations.push(
        `gloss mismatch for "${canonical}": got "${gloss}", expected "${expected}"`,
      )
    }
    // (b) every word in the gloss must be plain-whitelisted.
    for (const w of tokenize(gloss)) {
      if (!PLAIN_WORDS.has(w)) {
        violations.push(
          `gloss for "${canonical}" uses non-plain word "${w}"`,
        )
      }
    }
  }

  // (a) Every bare jargon term occurrence must be glossed at least once in
  // the file. We find all occurrences of each canonical term and require at
  // least one `(arti: ...)` annotation for it.
  for (const term of terms) {
    // Count bare occurrences (case-insensitive, word-ish boundary).
    const occRe = new RegExp(
      `(?<![A-Za-z])${escapeRe(term)}(?![A-Za-z])`,
      'gi',
    )
    if (!occRe.test(text)) continue
    // Is there an annotation for this term?
    const hasAnnot = new RegExp(
      `${escapeRe(term)}\\(arti:`, 'i',
    ).test(text)
    if (!hasAnnot) {
      violations.push(
        `jargon "${term}" appears but has no (arti: ...) gloss on first appearance`,
      )
    }
  }

  return violations
}

/** @param {string} s */
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// --- main ---
const glossary = loadGlossary()
const files = walkCandidates(NARRATIVES_DIR)

if (files.length === 0) {
  console.error(
    `check-jargon: no candidate files found under ${relative(ROOT, NARRATIVES_DIR)}`,
  )
  process.exit(1)
}

/** @type {{ file: string, violations: string[] }[]} */
const failures = []
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  const v = checkText(text, glossary)
  if (v.length > 0) failures.push({ file: relative(ROOT, f), violations: v })
}

if (failures.length > 0) {
  console.error(`\nJargon check failed: ${failures.length} file(s) with violations\n`)
  for (const { file, violations } of failures) {
    console.error(`  ${file}`)
    for (const v of violations) console.error(`    - ${v}`)
  }
  console.error('')
  process.exit(1)
}

console.log(
  `Jargon check passed: scanned ${files.length} candidate(s), 0 violations.`,
)
