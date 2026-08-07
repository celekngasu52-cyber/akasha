// src/engines/bazi/strength.ts — day-master strength (旺衰) scoring.
//
// Scoring rule (per the engine spec):
//   - Each of the four stems weighs 2; each of the four branches weighs 1.
//   - A stem/branch whose element is the SAME as the day master, or which
//     GENERATES the day master (生), contributes +weight.
//   - A stem/branch whose element the day master GENERATES (泄), CONTROLS
//     (克), or is CONTROLLED BY (耗) contributes -weight.
//   - Verdict: score >= +2 => 'strong'; score <= -2 => 'weak'; else
//     'balanced'.
//
// Element assignments are the canonical BaZi mappings (see
// docs/bazi-school.md). The day master is the day pillar's heavenly stem.

import type { FourPillars, Strength, StrengthVerdict } from './types'

const STEM_ELEMENT: Record<string, Element> = {
  甲: 'wood', 乙: 'wood',
  丙: 'fire', 丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water',
}

const BRANCH_ELEMENT: Record<string, Element> = {
  子: 'water', 丑: 'earth',
  寅: 'wood', 卯: 'wood',
  辰: 'earth', 巳: 'fire',
  午: 'fire', 未: 'earth',
  申: 'metal', 酉: 'metal',
  戌: 'earth', 亥: 'water',
}

type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

// 生成 cycle: source -> target it generates (生). 木生火, 火生土, 土生金,
// 金生水, 水生木.
const GENERATES: Record<Element, Element> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
}

// 克制 cycle: source -> target it controls (克). 木克土, 土克水, 水克火,
// 火克金, 金克木.
const CONTROLS: Record<Element, Element> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
}

/**
 * Compute day-master strength from the four pillars. The day stem's own
 * element is the day master (日主). Each pillar contributes its stem
 * (weight 2) and its branch (weight 1); the day pillar's stem is the day
 * master itself and counts as +2 (same element).
 */
export function computeStrength(pillars: FourPillars): Strength {
  const dayMaster = STEM_ELEMENT[pillars.day.stem]
  const slots = [pillars.year, pillars.month, pillars.day, pillars.hour]
  let score = 0
  for (const p of slots) {
    score += stemContribution(STEM_ELEMENT[p.stem], dayMaster) * 2
    score += branchContribution(BRANCH_ELEMENT[p.branch], dayMaster) * 1
  }
  return { score, verdict: verdict(score) }
}

function verdict(score: number): StrengthVerdict {
  if (score >= 2) return 'strong'
  if (score <= -2) return 'weak'
  return 'balanced'
}

/**
 * +1 if the element supports the day master (same element, or generates
 * it). -1 if it drains (day master generates it), controls the day master,
 * or is controlled by the day master. The four non-support relations all
 * reduce strength equally under this engine's scoring.
 */
function stemContribution(el: Element, dayMaster: Element): number {
  if (el === dayMaster) return 1
  if (GENERATES[el] === dayMaster) return 1 // el 生 dayMaster (resource)
  if (GENERATES[dayMaster] === el) return -1 // dayMaster 生 el (output)
  if (CONTROLS[el] === dayMaster) return -1 // el 克 dayMaster (power over)
  if (CONTROLS[dayMaster] === el) return -1 // dayMaster 克 el (wealth)
  return 0 // unreachable: the five relations cover all cross-element pairs
}

/**
 * Same rule as stems, applied to the branch's primary element. Hidden stems
 * within a branch are intentionally not split out; the spec scores the
 * branch as a unit (weight 1) using its dominant element.
 */
function branchContribution(el: Element, dayMaster: Element): number {
  return stemContribution(el, dayMaster)
}
