// src/engines/ziwei/chart.ts — orchestrator: compute the full Zi Wei chart.
//
// Given a BirthData value and gender, computes the complete 紫微斗数 chart:
// solar/lunar dates, four pillars (with late-zi day advancement), 命/身宫,
// 五行局, 12-palace layout, 14 primary stars, auxiliary stars, and 四化.
//
// All public functions are pure and deterministic.

import { Solar, I18n } from 'lunar-javascript'
import type { BirthData } from '../../core/birth'
import type { ZiWeiChart, Palace, PalaceStar, Gender } from './types'
import {
  computeMingShenGong,
  computeBureau,
  buildPalaceLayout,
  palaceStemAt,
  absToRel,
  BRANCHES,
} from './bureau'
import {
  getZiweiTianfuIndex,
  placePrimaryStars,
  placeAuxStars,
  relToAbsPalaces,
  computeSiHua,
  siHuaFlagMap,
} from './stars'

I18n.setLanguage('zh')

/**
 * Resolve a BirthData value into a wall-clock {y,m,d,h,mi,s} tuple.
 * Mirrors bazi/four-pillars.resolveWallClock.
 */
function resolveWallClock(data: BirthData): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} {
  const [y, mo, d] = data.dateISO.split('-').map(Number)
  let hour = 12
  let minute = 0
  let second = 0
  if (data.timeISO) {
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(data.timeISO)
    if (m) {
      hour = Number(m[1])
      minute = Number(m[2])
      second = m[3] === undefined ? 0 : Number(m[3])
    }
  }
  return { year: y, month: mo, day: d, hour, minute, second }
}

/** Compute the time-branch index (子=0 .. 亥=11) and late-zi flag. */
function computeTimeBranch(hour: number): { timeBranchIndex: number; isLateZi: boolean } {
  if (hour === 23) return { timeBranchIndex: 0, isLateZi: true } // 晚子时
  if (hour === 0) return { timeBranchIndex: 0, isLateZi: false } // 早子时
  // 1-22: floor((hour+1)/2) maps to 1..11 (丑..亥)
  return { timeBranchIndex: Math.floor((hour + 1) / 2), isLateZi: false }
}

/**
 * Compute the four pillars, applying late-zi day advancement.
 *
 * For 23:00-24:00 (晚子时), the day pillar advances to the next day's
 * stem-branch, and the time stem is computed from the advanced day stem
 * (五鼠遁). The lunar date used for the ZWDS chart stays on the current
 * day (dayDivide='current' convention).
 */
function computeFourPillars(data: BirthData, isLateZi: boolean): {
  lunar: ReturnType<Solar['getLunar']>
  yearGanZhi: string
  monthGanZhi: string
  dayGanZhi: string
  timeGanZhi: string
} {
  const t = resolveWallClock(data)
  // For the ZWDS chart, always use the current day (dayDivide='current').
  const solar = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, t.second)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  let yearGanZhi = ec.getYear()
  let monthGanZhi = ec.getMonth()
  let dayGanZhi = ec.getDay()
  let timeGanZhi = ec.getTime()

  if (isLateZi) {
    // Day pillar advances to next day; time stem from advanced day (五鼠遁).
    const nextSolar = Solar.fromYmdHms(t.year, t.month, t.day + 1, 0, 0, 0)
    const nextEc = nextSolar.getLunar().getEightChar()
    dayGanZhi = nextEc.getDay()
    // Time pillar: 子时 with stem from the advanced day's 五鼠遁.
    const dayStem = dayGanZhi[0]
    const ratRule: Record<string, string> = {
      甲: '甲', 己: '甲', 乙: '丙', 庚: '丙', 丙: '戊', 辛: '戊',
      丁: '庚', 壬: '庚', 戊: '壬', 癸: '壬',
    }
    const timeStem = ratRule[dayStem]
    timeGanZhi = timeStem + '子'
  }

  return { lunar, yearGanZhi, monthGanZhi, dayGanZhi, timeGanZhi }
}

/**
 * Compute the complete Zi Wei Dou Shu chart.
 *
 * @param data  Birth data (date, time, location, timezone).
 * @param gender  1 = male, 0 = female.
 * @returns The complete chart matching the fixture shape.
 */
export function computeZiWeiChart(data: BirthData, _gender: Gender): ZiWeiChart {
  const t = resolveWallClock(data)
  const { timeBranchIndex, isLateZi } = computeTimeBranch(t.hour)

  const {
    lunar, yearGanZhi, monthGanZhi, dayGanZhi, timeGanZhi,
  } = computeFourPillars(data, isLateZi)

  const lunarMonth = lunar.getMonth()
  const lunarDay = lunar.getDay()
  const lunarDateStr = lunar.toString()
  const yearStem = yearGanZhi[0]
  const yearBranch = yearGanZhi[1]

  // 命/身宫
  const { mingGongBranchIndex, shenGongBranchIndex } = computeMingShenGong(
    lunarMonth, timeBranchIndex,
  )

  // 命宫 stem-branch → 五行局
  const mingRel = absToRel(mingGongBranchIndex)
  const mingStem = palaceStemAt(mingRel, yearStem)
  const mingBranch = BRANCHES[mingGongBranchIndex]
  const naYinBureau = computeBureau(mingStem, mingBranch)

  // 紫微/天府 positions
  const { ziweiIndex, tianfuIndex } = getZiweiTianfuIndex(lunarDay, naYinBureau.number)

  // 四化
  const siHua = computeSiHua(yearStem)
  const siHuaMap = siHuaFlagMap(yearStem)

  // Stars (寅-relative, then convert to absolute)
  const primaryRel = placePrimaryStars(ziweiIndex, tianfuIndex, siHuaMap)
  const auxRel = placeAuxStars(yearStem, yearBranch, lunarMonth, timeBranchIndex, siHuaMap)
  const primaryAbs = relToAbsPalaces(primaryRel)
  const auxAbs = relToAbsPalaces(auxRel)

  // Palace layout
  const layout = buildPalaceLayout(
    mingGongBranchIndex, shenGongBranchIndex, yearStem, naYinBureau.number,
  )

  // Merge stars into palaces
  const palaces: Palace[] = layout.map((p) => {
    const stars: PalaceStar[] = [
      ...(primaryAbs[p.branchIndex] || []),
      ...(auxAbs[p.branchIndex] || []),
    ]
    return {
      branchIndex: p.branchIndex,
      branch: p.branch,
      ganZhi: p.ganZhi,
      name: p.name,
      ageRange: p.ageRange,
      stars,
      isMingGong: p.isMingGong,
      isShenGong: p.isShenGong,
    }
  })

  return {
    solarDate: data.dateISO,
    lunarDate: lunarDateStr,
    lunarMonth,
    lunarDay,
    yearGanZhi,
    monthGanZhi,
    dayGanZhi,
    timeGanZhi,
    timeBranchIndex,
    isLateZi,
    naYinBureau,
    mingGongBranchIndex,
    shenGongBranchIndex,
    palaces,
    siHua,
  }
}
