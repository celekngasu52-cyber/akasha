// src/lib/bazi-elements.ts — pure five-element (五行) helpers for BaZi.
//
// Maps the 10 heavenly stems (天干) and 12 earthly branches (地支) to their
// five elements, computes a weighted natal tally (stems weigh 2, branches 1,
// mirroring src/pages/dashboard-data.ts natalTally), and derives per-element
// share + strongest/weakest signals for the 喜用神 line paid BaZi sites show.
//
// All colors use var(--aka-*) tokens except water — the theme has no blue
// token, so water uses one documented muted-blue hex (#6f95b8). Everything is
// pure and deterministic; no Math.random, no side effects.

import type { FourPillars } from '../engines/bazi'

/** The five elements (五行) in canonical generation order. */
export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

/** Canonical element order (wood → fire → earth → metal → water). */
export const FIVE_ELEMENTS: readonly FiveElement[] = Object.freeze([
  'wood', 'fire', 'earth', 'metal', 'water',
])

/** Heavenly stem → element: 甲乙木 丙丁火 戊己土 庚辛金 壬癸水. */
export const STEM_ELEMENT: Readonly<Record<string, FiveElement>> = Object.freeze({
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
  己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
})

/** Earthly branch → element: 子水 丑土 寅木 卯木 辰土 巳火 午火 未土 申金 酉金 戌土 亥水. */
export const BRANCH_ELEMENT: Readonly<Record<string, FiveElement>> = Object.freeze({
  子: 'water', 丑: 'earth', 寅: 'wood', 卯: 'wood', 辰: 'earth', 巳: 'fire',
  午: 'fire', 未: 'earth', 申: 'metal', 酉: 'metal', 戌: 'earth', 亥: 'water',
})

/** Indonesian element labels (Kayu/Api/Tanah/Logam/Air). */
export const ELEMENT_LABEL_ID: Readonly<Record<FiveElement, string>> = Object.freeze({
  wood: 'Kayu', fire: 'Api', earth: 'Tanah', metal: 'Logam', water: 'Air',
})

/** Chinese element glyphs (木火土金水). */
export const ELEMENT_GLYPH: Readonly<Record<FiveElement, string>> = Object.freeze({
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
})

/**
 * Element → color token. All use var(--aka-*) except water: the warm archival
 * theme has no blue token, so water uses #6f95b8 — a muted desaturated blue
 * that reads as 水 without breaking the manuscript palette. This is the ONLY
 * hardcoded hex in the feature.
 */
export const ELEMENT_COLOR: Readonly<Record<FiveElement, string>> = Object.freeze({
  wood: 'var(--aka-success)',
  fire: 'var(--aka-danger)',
  earth: 'var(--aka-warning)',
  metal: 'var(--aka-fg)',
  water: '#6f95b8', // muted blue for 水 — theme has no blue token
})

/** Per-element weighted count from a four-pillar chart. */
export interface ElementTally {
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
}

/** Element of a heavenly stem (fallback 'earth' for unknown chars). */
export function elementOfStem(stem: string): FiveElement {
  return STEM_ELEMENT[stem] ?? 'earth'
}

/** Element of an earthly branch (fallback 'earth' for unknown chars). */
export function elementOfBranch(branch: string): FiveElement {
  return BRANCH_ELEMENT[branch] ?? 'earth'
}

/**
 * Weighted natal tally: each pillar's stem counts 2, its branch counts 1
 * (12 weight units total across 4 pillars). Mirrors the natalTally convention
 * in src/pages/dashboard-data.ts exactly.
 */
export function elementTally(pillars: FourPillars): ElementTally {
  const tally: ElementTally = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  const all = [pillars.year, pillars.month, pillars.day, pillars.hour]
  for (const p of all) {
    tally[elementOfStem(p.stem)] += 2
    tally[elementOfBranch(p.branch)] += 1
  }
  return tally
}

/** Total weight across all five elements. */
function tallyTotal(t: ElementTally): number {
  return t.wood + t.fire + t.earth + t.metal + t.water
}

/**
 * Element's share of the total (0..1). Returns 0.2 (even split) when the
 * total is 0, so a degenerate empty chart does not divide by zero.
 */
export function elementShare(tally: ElementTally, el: FiveElement): number {
  const total = tallyTotal(tally)
  if (total === 0) return 0.2
  return tally[el] / total
}

/**
 * Strongest element by share (ties broken by FIVE_ELEMENTS order — wood first).
 */
export function strongestElement(tally: ElementTally): FiveElement {
  let best: FiveElement = FIVE_ELEMENTS[0]
  let bestShare = elementShare(tally, best)
  for (const el of FIVE_ELEMENTS) {
    const s = elementShare(tally, el)
    if (s > bestShare) {
      best = el
      bestShare = s
    }
  }
  return best
}

/**
 * Weakest element by share (ties broken by FIVE_ELEMENTS order — wood first).
 */
export function weakestElement(tally: ElementTally): FiveElement {
  let worst: FiveElement = FIVE_ELEMENTS[0]
  let worstShare = elementShare(tally, worst)
  for (const el of FIVE_ELEMENTS) {
    const s = elementShare(tally, el)
    if (s < worstShare) {
      worst = el
      worstShare = s
    }
  }
  return worst
}
