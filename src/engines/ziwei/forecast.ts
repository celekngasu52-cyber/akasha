// src/engines/ziwei/forecast.ts — 流年/流月/流日 (year/month/day) + 大限 forecast.
//
// Pure deterministic Zi Wei forecast over a target Gregorian date. The
// active palace for each horizon is derived from the target date's earthly
// branch (year/month/day) or the natal chart's 大限 age ranges (decade).
//
// palaceFocus[] scoring rule (per the plan, todo 8): for each palace, the
// energy score is the sum of its main-star weights — 紫微/天府/七杀/破军
// contribute 3, every other main star contributes 1. palaceFocus is the
// top-2 palaces by that score, returned in descending order.
//
// All public functions are pure: same BirthData + gender + date -> same
// output, because the underlying chart engine is deterministic.

import { Solar } from 'lunar-javascript'
import type { BirthData } from '../../core/birth'
import type {
  ZiWeiChart,
  Palace,
  Gender,
  ZiWeiForecastHorizon,
  PalaceFocus,
} from './types'
import { computeZiWeiChart } from './chart'

/** Minimal Lunar interface used by this module. */
interface LunarLike {
  getYearZhi(): string
  getMonthZhi(): string
  getDayZhi(): string
}

/** Main stars that carry weight 3 in the palaceFocus scoring rule. */
const HEAVY_STARS: ReadonlySet<string> = new Set([
  '紫微',
  '天府',
  '七杀',
  '破军',
])

/** Weight 3 for the four pivots; 1 for all other main stars. */
function starWeight(name: string): number {
  return HEAVY_STARS.has(name) ? 3 : 1
}

/** Sum main-star weights for a single palace (aux stars are ignored). */
function palaceScore(p: Palace): number {
  let s = 0
  for (const star of p.stars) {
    if (star.type === 'main') s += starWeight(star.name)
  }
  return s
}

/**
 * Compute palaceFocus: the top-2 palaces by energy score, descending.
 * Stable tie-break: higher branchIndex wins (deterministic).
 */
function computePalaceFocus(palaces: readonly Palace[]): PalaceFocus[] {
  const scored = palaces.map((p) => ({
    branchIndex: p.branchIndex,
    name: p.name,
    score: palaceScore(p),
  }))
  scored.sort((a, b) => b.score - a.score || b.branchIndex - a.branchIndex)
  return scored.slice(0, 2)
}

/** Year branch index (子=0 .. 亥=11) from a lunar-javascript Lunar date. */
function yearBranchIndex(lunar: LunarLike): number {
  return branchCharToIndex(lunar.getYearZhi())
}

/** Month branch index from the lunar-javascript Lunar month branch. */
function monthBranchIndex(lunar: LunarLike): number {
  return branchCharToIndex(lunar.getMonthZhi())
}

/** Day branch index from the lunar-javascript Lunar day branch. */
function dayBranchIndex(lunar: LunarLike): number {
  return branchCharToIndex(lunar.getDayZhi())
}

function branchCharToIndex(branch: string): number {
  const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
  const idx = BRANCHES.indexOf(branch)
  if (idx === -1) throw new Error(`unknown branch: ${branch}`)
  return idx
}

/**
 * 大限 (decade) active palace: the palace whose ageRange covers the
 * subject's age at the target date. For male (yang) the 大限 runs clockwise
 * from 命宫; for female (yin) counterclockwise. The chart already encodes
 * the correct direction into each palace's ageRange, so we match by age.
 */
function decadePalace(chart: ZiWeiChart, age: number): Palace {
  let best = chart.palaces[0]
  let bestHi = -1
  for (const p of chart.palaces) {
    const [loStr, hiStr] = p.ageRange.split('-')
    const lo = Number(loStr)
    const hi = Number(hiStr)
    if (age >= lo && age <= hi) return p
    if (hi > bestHi) {
      bestHi = hi
      best = p
    }
  }
  return best
}

/** Age in years at the target date (birth -> target, floor). */
function ageAt(birth: BirthData, target: Date): number {
  const b = new Date(`${birth.dateISO}T00:00:00Z`)
  const t = new Date(target)
  let age = t.getUTCFullYear() - b.getUTCFullYear()
  const mDiff = t.getUTCMonth() - b.getUTCMonth()
  if (mDiff < 0 || (mDiff === 0 && t.getUTCDate() < b.getUTCDate())) {
    age -= 1
  }
  return age
}

function toLunar(dateISO: string): LunarLike {
  const [y, m, d] = dateISO.split('-').map(Number)
  const solar = Solar.fromYmd(y, m, d)
  return solar.getLunar()
}

/**
 * 流年 forecast: active palace = natal palace whose branchIndex matches
 * the target year's earthly branch. Returns palaceFocus top-2.
 */
export function computeYearlyForecast(
  birth: BirthData,
  gender: Gender,
  dateISO: string,
): ZiWeiForecastHorizon {
  const chart = computeZiWeiChart(birth, gender)
  const lunar = toLunar(dateISO)
  const yi = yearBranchIndex(lunar)
  const active = chart.palaces[yi]
  return {
    kind: 'year',
    dateISO,
    activePalaceIndex: yi,
    activePalaceName: active.name,
    palaceFocus: computePalaceFocus(chart.palaces),
  }
}

/** 流月 forecast: active palace = year branch index + month branch offset. */
export function computeMonthlyForecast(
  birth: BirthData,
  gender: Gender,
  dateISO: string,
): ZiWeiForecastHorizon {
  const chart = computeZiWeiChart(birth, gender)
  const lunar = toLunar(dateISO)
  const mi = monthBranchIndex(lunar)
  const active = chart.palaces[mi]
  return {
    kind: 'month',
    dateISO,
    activePalaceIndex: mi,
    activePalaceName: active.name,
    palaceFocus: computePalaceFocus(chart.palaces),
  }
}

/** 流日 forecast: active palace = natal palace at the day's branch. */
export function computeDailyForecast(
  birth: BirthData,
  gender: Gender,
  dateISO: string,
): ZiWeiForecastHorizon {
  const chart = computeZiWeiChart(birth, gender)
  const lunar = toLunar(dateISO)
  const di = dayBranchIndex(lunar)
  const active = chart.palaces[di]
  return {
    kind: 'day',
    dateISO,
    activePalaceIndex: di,
    activePalaceName: active.name,
    palaceFocus: computePalaceFocus(chart.palaces),
  }
}

/** 大限 (decade) forecast: active palace derived from age vs ageRange. */
export function computeDecadeForecast(
  birth: BirthData,
  gender: Gender,
  dateISO: string,
): ZiWeiForecastHorizon {
  const chart = computeZiWeiChart(birth, gender)
  const [y, m, d] = dateISO.split('-').map(Number)
  const age = ageAt(birth, new Date(Date.UTC(y, m - 1, d)))
  const active = decadePalace(chart, age)
  return {
    kind: 'decade',
    dateISO,
    activePalaceIndex: active.branchIndex,
    activePalaceName: active.name,
    palaceFocus: computePalaceFocus(chart.palaces),
  }
}
