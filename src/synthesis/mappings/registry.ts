// src/synthesis/mappings/registry.ts — the 16-entry rule registry + lookup.
//
// Extracted from the original mappings.ts as a mechanical split (todo 1 F2
// debt). 4 engines × 4 domains = 16 explicitly defined entries. Pure and
// deterministic. Public types live in ./types.ts.

import { BAZI_RULES } from './bazi-rules'
import { ZIWEI_RULES } from './ziwei-rules'
import { VEDIC_RULES } from './vedic-rules'
import { WESTERN_RULES } from './western-rules'
import type { Domain, EngineName, MappingEntry, Rule } from './types'

// ---------------------------------------------------------------------------
// The 16-entry registry (4 engines × 4 domains) — EXPLICITLY defined
// ---------------------------------------------------------------------------

function entry(
  engine: EngineName,
  domain: Domain,
  condition: string,
  tokens: readonly string[],
  rule: Rule,
): MappingEntry {
  return { engine, domain, condition, tokens, rule }
}

// (engine, domain, human-readable condition, tokens, rule)
const MAPPINGS_RAW: readonly MappingEntry[] = [
  // BaZi
  entry('BaZi', 'Karier', 'dayMaster strong ∧ resource menonjol', ['官', '印'], BAZI_RULES.Karier),
  entry('BaZi', 'Cinta', 'wealth menonjol pada pillar', ['财'], BAZI_RULES.Cinta),
  entry('BaZi', 'Kesehatan', 'dayMaster-support kuat', ['日主-support'], BAZI_RULES.Kesehatan),
  entry(
    'BaZi', 'Keuangan', 'wealth ∧ food menonjol ∧ dayMaster mampu',
    ['财', '食'], BAZI_RULES.Keuangan,
  ),
  // ZiWei
  entry('ZiWei', 'Karier', '官禄 palace berbintang utama + 禄', ['官禄', '禄'], ZIWEI_RULES.Karier),
  entry('ZiWei', 'Cinta', '夫妻 palace berbintang utama', ['夫妻', '福德'], ZIWEI_RULES.Cinta),
  entry('ZiWei', 'Kesehatan', '疾厄 palace bebas 忌', ['疾厄', '命宫'], ZIWEI_RULES.Kesehatan),
  entry('ZiWei', 'Keuangan', '财帛 palace + 禄', ['财帛'], ZIWEI_RULES.Keuangan),
  // Vedic
  entry('Vedic', 'Karier', 'benefik di rumah 10/6/11', ['10', '6', '11'], VEDIC_RULES.Karier),
  entry('Vedic', 'Cinta', 'benefik di rumah 7/5', ['7', '5'], VEDIC_RULES.Cinta),
  entry('Vedic', 'Kesehatan', 'lagna & rumah 6 seimbang', ['1', '6', '8'], VEDIC_RULES.Kesehatan),
  entry('Vedic', 'Keuangan', 'benefik di rumah 2/11/9', ['2', '11', '9'], VEDIC_RULES.Keuangan),
  // Western
  entry('Western', 'Karier', 'benefik di rumah 10/6/2', ['10', '6', '2'], WESTERN_RULES.Karier),
  entry('Western', 'Cinta', 'venus/jupiter di rumah 7/5', ['7', '5'], WESTERN_RULES.Cinta),
  entry(
    'Western', 'Kesehatan', 'rumah 1/6/12 seimbang',
    ['1', '6', '12'], WESTERN_RULES.Kesehatan,
  ),
  entry(
    'Western', 'Keuangan', 'benefik di rumah 2/8/11',
    ['2', '8', '11'], WESTERN_RULES.Keuangan,
  ),
]

export { MAPPINGS_RAW as MAPPINGS }

/**
 * Look up the rule for a (engine, domain) pair.
 * Throws if no mapping exists (should never happen — registry is exhaustive).
 */
export function ruleFor(engine: EngineName, domain: Domain): Rule {
  const found = MAPPINGS_RAW.find((m) => m.engine === engine && m.domain === domain)
  if (!found) {
    throw new Error(`no mapping for ${engine}/${domain}`)
  }
  return found.rule
}
