// src/synthesis/mappings/bazi-rules.ts — BaZi engine rules (4 domains).
//
// Extracted from the original mappings.ts as a mechanical split (todo 1 F2
// debt). Pure and deterministic: same Chart4 slice -> same RuleResult.
// Public types live in ./types.ts.

import type { TenGods } from '../../engines/bazi/types'
import type { Chart4, Domain, RuleResult, Vote } from './types'

// ---------------------------------------------------------------------------
// BaZi helpers — ten-god token counting (stems weight 2, branches weight 1)
// ---------------------------------------------------------------------------

/** Ten-god → domain-token family. A god belongs to at most one family here. */
const TEN_GOD_FAMILY: Record<string, string> = {
  正官: '官',
  偏官: '官',
  七杀: '官',
  正印: '印',
  偏印: '印',
  正财: '财',
  偏财: '财',
  食神: '食',
  伤官: '食',
  比肩: '比劫',
  劫财: '比劫',
}

/** Sum of stem (×2) + branch (×1) contributions for one token family. */
function baziTokenScore(tenGods: TenGods, family: string): number {
  let score = 0
  for (const slot of [tenGods.year, tenGods.month, tenGods.day, tenGods.hour]) {
    if (TEN_GOD_FAMILY[slot.stem] === family) score += 2
    for (const b of slot.branches) {
      if (TEN_GOD_FAMILY[b] === family) score += 1
    }
  }
  return score
}

/** Day-master element from the day stem (for Kesehatan resource detection). */
const STEM_ELEMENT: Record<string, string> = {
  甲: 'wood', 乙: 'wood',
  丙: 'fire', 丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water',
}

const BRANCH_ELEMENT: Record<string, string> = {
  子: 'water', 丑: 'earth',
  寅: 'wood', 卯: 'wood',
  辰: 'earth', 巳: 'fire',
  午: 'fire', 未: 'earth',
  申: 'metal', 酉: 'metal',
  戌: 'earth', 亥: 'water',
}

const GENERATES: Record<string, string> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
}

/** True if the stem/branch element supports the day master (same or generates). */
function supportsDayMaster(el: string, dayMasterEl: string): boolean {
  return el === dayMasterEl || GENERATES[el] === dayMasterEl
}

// ---------------------------------------------------------------------------
// BaZi rules (4)
// ---------------------------------------------------------------------------

function baziKarier(chart: Chart4): RuleResult {
  const { strength, tenGods } = chart.bazi
  const officer = baziTokenScore(tenGods, '官')
  const resource = baziTokenScore(tenGods, '印')
  const strong = strength.verdict === 'strong'
  let vote: Vote = 0
  let alasan = 'Day master '
  if (strong) {
    alasan += 'kuat dan '
    if (officer >= 2 || resource >= 2) {
      vote = 1
      alasan += 'elemen resource menonjol'
    } else {
      vote = 0
      alasan += 'tetapi elemen resource tidak menonjol'
    }
  } else {
    alasan += 'tidak kuat'
    vote = officer >= 4 ? 1 : 0
    if (vote === 1) alasan += ', namun elemen officer sangat menonjol'
  }
  const weight = Math.min(1, (officer + resource) / 6)
  return { engine: 'BaZi', domain: 'Karier', vote, weight, alasanSingkat: alasan + '.' }
}

function baziCinta(chart: Chart4): RuleResult {
  const { tenGods } = chart.bazi
  const wealth = baziTokenScore(tenGods, '财')
  const vote: Vote = wealth >= 3 ? 1 : wealth === 0 ? -1 : 0
  const weight = Math.min(1, wealth / 6)
  const alasan =
    wealth >= 3
      ? 'Elemen wealth menonjol pada pillar.'
      : wealth === 0
        ? 'Elemen wealth absen pada pillar.'
        : 'Elemen wealth sedang pada pillar.'
  return { engine: 'BaZi', domain: 'Cinta', vote, weight, alasanSingkat: alasan }
}

function baziKesehatan(chart: Chart4): RuleResult {
  const { pillars } = chart.bazi
  const dayEl = STEM_ELEMENT[pillars.day.stem] ?? 'earth'
  let support = 0
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    if (supportsDayMaster(STEM_ELEMENT[p.stem] ?? '', dayEl)) support += 2
    if (supportsDayMaster(BRANCH_ELEMENT[p.branch] ?? '', dayEl)) support += 1
  }
  const vote: Vote = support >= 5 ? 1 : support <= 1 ? -1 : 0
  const weight = Math.min(1, support / 8)
  const alasan =
    support >= 5
      ? 'Day master mendapat dukungan elemen yang kuat.'
      : support <= 1
        ? 'Day master kekurangan dukungan elemen.'
        : 'Day master mendapat dukungan elemen sedang.'
  return { engine: 'BaZi', domain: 'Kesehatan', vote, weight, alasanSingkat: alasan }
}

function baziKeuangan(chart: Chart4): RuleResult {
  const { strength, tenGods } = chart.bazi
  const wealth = baziTokenScore(tenGods, '财')
  const output = baziTokenScore(tenGods, '食')
  const weak = strength.verdict === 'weak'
  // Weak day master cannot carry wealth — output (food) generates wealth
  // only when the day master is supported enough.
  let vote: Vote = 0
  let alasan = 'Day master '
  if (weak) {
    alasan += 'lemah, sulit menahan wealth'
    vote = output >= 3 ? 0 : -1
  } else {
    alasan += 'mampu menahan wealth'
    vote = wealth >= 2 && output >= 1 ? 1 : wealth >= 2 ? 0 : 0
  }
  const weight = Math.min(1, (wealth + output) / 6)
  return { engine: 'BaZi', domain: 'Keuangan', vote, weight, alasanSingkat: alasan + '.' }
}

/** All four BaZi rules, keyed by domain for the registry. */
export const BAZI_RULES: Record<Domain, (chart: Chart4) => RuleResult> = {
  Karier: baziKarier,
  Cinta: baziCinta,
  Kesehatan: baziKesehatan,
  Keuangan: baziKeuangan,
}
