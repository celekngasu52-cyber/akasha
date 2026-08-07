// src/engines/bazi/forecast.ts — 流年/流月/流日 (year/month/day) forecast.
//
// Pure deterministic forecast over a target Gregorian date. The day, month,
// and year pillars of the target date come from lunar-javascript EightChar,
// which already resolves solar-term boundaries (立春 for the year pillar,
// 节 for the month pillar). The birth chart's day master (日主) is reused to
// detect standard gan-zhi interactions (clash/combine/control) between the
// birth chart and the target pillars.
//
// Every horizon exposes all five element scores (stems weight 2, branches 1)
// and the four standard interaction kinds (branch clash, branch combine,
// branch control, stem combine).

import { Solar, I18n } from 'lunar-javascript'
import type { BirthData } from '../../core/birth'
import type {
  ActiveLuck,
  ElementScores,
  ForecastHorizon,
  ForecastInteractions,
  ForecastPillar,
  Gender,
  LuckPillar,
} from './types'
import { resolveWallClock } from './four-pillars'
import { computeLuckPillars } from './luck-pillars'

I18n.setLanguage('zh')

type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

const STEM_ELEMENT: Record<string, Element> = {
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
  己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
}

const BRANCH_ELEMENT: Record<string, Element> = {
  子: 'water', 丑: 'earth', 寅: 'wood', 卯: 'wood', 辰: 'earth', 巳: 'fire',
  午: 'fire', 未: 'earth', 申: 'metal', 酉: 'metal', 戌: 'earth', 亥: 'water',
}

// 地支六冲 (branch clashes): opposite branches on the zodiac wheel.
const BRANCH_CLASH: Record<string, string> = {
  子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅',
  卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳',
}

// 地支六合 (branch combinations): six harmonious pairs.
const BRANCH_COMBINE: Record<string, string> = {
  子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯',
  辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午',
}

// 天干五合 (stem combinations): five harmonious stem pairs.
const STEM_COMBINE: Record<string, string> = {
  甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙',
  丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊',
}

// 五行相克 (element controls): source -> target it controls (克).
const CONTROLS: Record<Element, Element> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
}

/**
 * Resolve the birth day pillar's stem (日主) and branch from a BirthData
 * value, computed once via the same wall-clock resolution as
 * computeFourPillars. The stem drives stem combines; the branch drives
 * branch clashes and combines.
 */
function dayMaster(data: BirthData): { stem: string; branch: string } {
  const t = resolveWallClock(data)
  const ec = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, t.second)
    .getLunar().getEightChar()
  const gz = ec.getDay()
  return { stem: gz[0], branch: gz[1] }
}

/**
 * Compute the three target-date pillars (year/month/day) for a Gregorian
 * target date. The hour is fixed at 12:00 because a forecast targets a
 * calendar day, not a birth hour; the hour pillar is intentionally omitted.
 */
function targetPillars(year: number, month: number, day: number): ForecastPillar[] {
  const ec = Solar.fromYmdHms(year, month, day, 12, 0, 0)
    .getLunar().getEightChar()
  const make = (slot: 'year' | 'month' | 'day', gz: string): ForecastPillar => ({
    slot, ganZhi: gz, stem: gz[0], branch: gz[1],
  })
  return [
    make('year', ec.getYear()),
    make('month', ec.getMonth()),
    make('day', ec.getDay()),
  ]
}

/**
 * Five-element scores across the target pillars. Each stem contributes 2,
 * each branch contributes 1 (matching the strength engine's weighting).
 */
function elementScoresOf(pillars: ForecastPillar[]): ElementScores {
  const scores: ElementScores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  for (const p of pillars) {
    scores[STEM_ELEMENT[p.stem]] += 2
    scores[BRANCH_ELEMENT[p.branch]] += 1
  }
  return scores
}

/**
 * Standard gan-zhi interactions between the birth day pillar and the target
 * pillars. Each returned entry is the two-character gan-zhi of the target
 * pillar that participates in the interaction with the birth day master's
 * stem (for stem combines) or the birth day branch (for branch clash,
 * branch combine, and branch control).
 */
function interactionsOf(
  pillars: ForecastPillar[],
  dm: { stem: string; branch: string },
): ForecastInteractions {
  const out: ForecastInteractions = {
    clashes: [], combines: [], controls: [], stemCombines: [],
  }
  const dmEl = STEM_ELEMENT[dm.stem]
  for (const p of pillars) {
    if (BRANCH_CLASH[p.branch] === dm.branch) out.clashes.push(p.ganZhi)
    if (BRANCH_COMBINE[p.branch] === dm.branch) out.combines.push(p.ganZhi)
    if (STEM_COMBINE[p.stem] === dm.stem) out.stemCombines.push(p.ganZhi)
    const pEl = BRANCH_ELEMENT[p.branch]
    if (CONTROLS[pEl] === dmEl || CONTROLS[dmEl] === pEl) {
      out.controls.push(p.ganZhi)
    }
  }
  return out
}

/** Find the active 大運 covering the target year. */
function activeLuckOf(luck: LuckPillar[], targetYear: number): ActiveLuck | undefined {
  const hit = luck.find((lp) => targetYear >= lp.startYear && targetYear <= lp.endYear)
  if (!hit) return undefined
  return { ganZhi: hit.ganZhi, startYear: hit.startYear, endYear: hit.endYear }
}

function buildHorizon(
  kind: ForecastHorizon['kind'],
  targetISO: string,
  pillars: ForecastPillar[],
  dm: { stem: string; branch: string },
  activeLuck?: ActiveLuck,
): ForecastHorizon {
  return {
    kind,
    targetISO,
    pillars,
    elementScores: elementScoresOf(pillars),
    interactions: interactionsOf(pillars, dm),
    activeLuck,
  }
}

/**
 * Daily forecast for a target Gregorian date. Exposes the target day pillar
 * (plus the year/month pillars for context), five-element scores, and the
 * standard gan-zhi interactions with the birth day master.
 */
export function computeDailyForecast(
  data: BirthData,
  _gender: Gender,
  targetISO: string,
): ForecastHorizon {
  const [y, m, d] = parseISO(targetISO)
  const dm = dayMaster(data)
  const pillars = targetPillars(y, m, d)
  return buildHorizon('daily', targetISO, pillars, dm)
}

/**
 * Weekly forecast: seven daily horizons starting from `startISO`. The anchor
 * horizon's `days` field holds the seven entries; the anchor itself reports
 * the start-day pillars and element scores.
 */
export function computeWeeklyForecast(
  data: BirthData,
  _gender: Gender,
  startISO: string,
): ForecastHorizon {
  const dm = dayMaster(data)
  const [sy, sm, sd] = parseISO(startISO)
  const start = new Date(Date.UTC(sy, sm - 1, sd))
  const days: ForecastHorizon[] = []
  for (let i = 0; i < 7; i++) {
    const dt = new Date(start.getTime() + i * 86_400_000)
    const iso = isoOf(dt)
    const [y, m, d] = parseISO(iso)
    days.push(buildHorizon('daily', iso, targetPillars(y, m, d), dm))
  }
  const anchor = buildHorizon('weekly', startISO, targetPillars(sy, sm, sd), dm)
  anchor.days = days
  return anchor
}

/**
 * Monthly forecast for a target year/month. Exposes the target month pillar
 * (plus year/day pillars for context), five-element scores, interactions, and
 * the active 大運 covering the target year. The day pillar uses the 15th of
 * the month as a representative mid-month anchor.
 */
export function computeMonthlyForecast(
  data: BirthData,
  gender: Gender,
  year: number,
  month: number,
): ForecastHorizon {
  const dm = dayMaster(data)
  const luck = computeLuckPillars(data, gender)
  const pillars = targetPillars(year, month, 15)
  const iso = `${year}-${pad2(month)}-15`
  return buildHorizon('monthly', iso, pillars, dm, activeLuckOf(luck, year))
}

/**
 * Yearly forecast for a target year. Exposes the target year pillar (plus
 * month/day pillars for context), five-element scores, interactions, and the
 * active 大運 covering the target year. The month/day pillars use Jan 1st as
 * a representative year-start anchor.
 */
export function computeYearlyForecast(
  data: BirthData,
  gender: Gender,
  year: number,
): ForecastHorizon {
  const dm = dayMaster(data)
  const luck = computeLuckPillars(data, gender)
  const pillars = targetPillars(year, 1, 1)
  return buildHorizon('yearly', `${year}-01-01`, pillars, dm, activeLuckOf(luck, year))
}

function parseISO(iso: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`invalid ISO date: ${iso}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function isoOf(dt: Date): string {
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}
