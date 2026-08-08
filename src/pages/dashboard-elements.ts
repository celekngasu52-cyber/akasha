// src/pages/dashboard-elements.ts — five-element math for the dashboard.
//
// Extracted from dashboard-data.ts as a mechanical split (todo 1 F2 debt).
// Pure helpers: natal tally from four pillars, element share, score mapping,
// blending of natal + live horizon signal, per-domain scoring. No state,
// no I/O. Public types (DashboardDomain, DASHBOARD_DOMAINS) stay in
// dashboard-data.ts; this module imports them.

import type { BirthData } from '../core/birth'
import { computeFourPillars } from '../engines/bazi'
import type { ElementScores } from '../engines/bazi/types'
import type { DashboardDomain } from './dashboard-data'

const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const
type Element = (typeof ELEMENTS)[number]

/** Domain → the element whose live share drives that domain's swing. */
const DOMAIN_ELEMENT: Readonly<Record<DashboardDomain, Element>> = {
  Karier: 'fire',
  Cinta: 'water',
  Kesehatan: 'wood',
  Keuangan: 'earth',
}

/** Five-element tally type. */
export type Tally = Record<Element, number>

/** Sum of a five-element tally. */
function sumScores(s: Tally): number {
  return ELEMENTS.reduce((acc, e) => acc + Math.max(0, s[e]), 0)
}

/** Element share (fraction 0..1). */
function elShare(s: Tally, el: Element): number {
  const tot = sumScores(s)
  return tot === 0 ? 0.2 : Math.max(0, s[el]) / tot
}

/** Map a 0..1 share to a 0..100 score so a typical share (≈0.2) lands mid. */
function shareToScore(share: number): number {
  return Math.max(0, Math.min(100, Math.round(40 + share * 65)))
}

/** Clamp helper. */
function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** Blend natal personality (0.6) with the live horizon signal (0.4). */
function blend(natal: number, live: number): number {
  return clamp100(natal * 0.6 + live * 0.4)
}

/** Per-domain score: natal baseline + live element signal from a horizon. */
export function scoreFor(
  natal: Tally,
  hzElement: Tally | undefined,
  domain: DashboardDomain,
): number {
  const el = DOMAIN_ELEMENT[domain]
  const base = shareToScore(elShare(natal, el))
  const live = hzElement ? shareToScore(elShare(hzElement, el)) : base
  return blend(base, live)
}

type Gender = 0 | 1

/** Resolved engine gender: female → 0, everything else → 1 (documented default). */
export function genderOf(birth: BirthData): Gender {
  return birth.gender === 'female' ? 0 : 1
}

/** Natal five-element tally from the birth's four pillars (stems weigh 2, branches 1). */
export function natalTally(birth: BirthData): Tally {
  const pillars = computeFourPillars(birth)
  const tally: Tally = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  const STEM_EL: Record<string, Element> = {
    甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
    己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
  }
  const BRANCH_EL: Record<string, Element> = {
    子: 'water', 丑: 'earth', 寅: 'wood', 卯: 'wood', 辰: 'earth', 巳: 'fire',
    午: 'fire', 未: 'earth', 申: 'metal', 酉: 'metal', 戌: 'earth', 亥: 'water',
  }
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    tally[STEM_EL[p.stem] ?? 'earth'] += 2
    tally[BRANCH_EL[p.branch] ?? 'earth'] += 1
  }
  return tally
}

/** Tally from an elementScores record (ForecastHorizon.elementScores). */
export function tallyOf(el: ElementScores): Tally {
  return { wood: el.wood, fire: el.fire, earth: el.earth, metal: el.metal, water: el.water }
}
