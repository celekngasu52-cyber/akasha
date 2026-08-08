// src/synthesis/mappings/ziwei-rules.ts — ZiWei engine rules (4 domains).
//
// Extracted from the original mappings.ts as a mechanical split (todo 1 F2
// debt). Pure and deterministic: same Chart4 slice -> same RuleResult.
// Public types live in ./types.ts.

import type { ZiWeiChart } from '../../engines/ziwei/types'
import type { Chart4, Domain, RuleResult, Vote } from './types'

// ---------------------------------------------------------------------------
// ZiWei helpers — palace token lookup
// ---------------------------------------------------------------------------

/** Count stars in a palace whose name is in the given set. */
function ziweiStarsIn(chart: ZiWeiChart, palaceNames: readonly string[]): number {
  let count = 0
  for (const p of chart.palaces) {
    if (palaceNames.includes(p.name)) {
      for (const s of p.stars) count += s.type === 'main' ? 1 : 0
    }
  }
  return count
}

const ZIWEI_CAREER_PALACES = ['官禄', '事业'] as const
const ZIWEI_WEALTH_PALACES = ['财帛', '财福'] as const
const ZIWEI_RELATION_PALACES = ['夫妻', '福德'] as const
const ZIWEI_HEALTH_PALACES = ['疾厄', '命宫'] as const

// ---------------------------------------------------------------------------
// ZiWei rules (4)
// ---------------------------------------------------------------------------

function ziweiKarier(chart: Chart4): RuleResult {
  const stars = ziweiStarsIn(chart.ziwei, ZIWEI_CAREER_PALACES)
  const hasLu = Object.values(chart.ziwei.siHua).some((s) => s.includes('禄'))
  const vote: Vote = stars >= 2 ? 1 : stars === 0 ? 0 : 0
  const weight = Math.min(1, stars / 3)
  const alasan =
    stars >= 2
      ? `Palace 官禄 memiliki ${stars} bintang utama${hasLu ? ' dan membawa 禄' : ''}.`
      : 'Palace 官禄 minim bintang utama.'
  return { engine: 'ZiWei', domain: 'Karier', vote, weight, alasanSingkat: alasan }
}

function ziweiCinta(chart: Chart4): RuleResult {
  const stars = ziweiStarsIn(chart.ziwei, ZIWEI_RELATION_PALACES)
  const hasLu = Object.values(chart.ziwei.siHua).some((s) => s.includes('禄'))
  const vote: Vote = stars >= 2 ? 1 : stars === 0 ? -1 : 0
  const weight = Math.min(1, stars / 3)
  const alasan =
    stars >= 2
      ? `Palace 夫妻 memiliki ${stars} bintang utama${hasLu ? ' dan membawa 禄' : ''}.`
      : stars === 0
        ? 'Palace 夫妻 kosong dari bintang utama.'
        : `Palace 夫妻 memiliki ${stars} bintang utama.`
  return { engine: 'ZiWei', domain: 'Cinta', vote, weight, alasanSingkat: alasan }
}

function ziweiKesehatan(chart: Chart4): RuleResult {
  const stars = ziweiStarsIn(chart.ziwei, ZIWEI_HEALTH_PALACES)
  const hasJi = Object.values(chart.ziwei.siHua).some((s) => s.includes('忌'))
  const vote: Vote = hasJi ? -1 : stars >= 2 ? 1 : 0
  const weight = Math.min(1, stars / 3)
  const alasan = hasJi
    ? 'Palace 疾厄 membawa 忌 (taboo).'
    : stars >= 2
      ? `Palace 疾厄 memiliki ${stars} bintang utama.`
      : 'Palace 疾厄 netral.'
  return { engine: 'ZiWei', domain: 'Kesehatan', vote, weight, alasanSingkat: alasan }
}

function ziweiKeuangan(chart: Chart4): RuleResult {
  const stars = ziweiStarsIn(chart.ziwei, ZIWEI_WEALTH_PALACES)
  const hasLu = Object.values(chart.ziwei.siHua).some((s) => s.includes('禄'))
  const vote: Vote = stars >= 2 && hasLu ? 1 : stars >= 2 ? 0 : 0
  const weight = Math.min(1, (stars + (hasLu ? 1 : 0)) / 4)
  const alasan =
    stars >= 2 && hasLu
      ? `Palace 财帛 memiliki ${stars} bintang utama dan membawa 禄.`
      : stars >= 2
        ? `Palace 财帛 memiliki ${stars} bintang utama tanpa 禄.`
        : 'Palace 财帛 minim bintang utama.'
  return { engine: 'ZiWei', domain: 'Keuangan', vote, weight, alasanSingkat: alasan }
}

/** All four ZiWei rules, keyed by domain for the registry. */
export const ZIWEI_RULES: Record<Domain, (chart: Chart4) => RuleResult> = {
  Karier: ziweiKarier,
  Cinta: ziweiCinta,
  Kesehatan: ziweiKesehatan,
  Keuangan: ziweiKeuangan,
}
