// src/engines/bazi/ten-gods.ts — 十神 (ten gods) per pillar slot.
//
// Delegates to `lunar-javascript` EightChar's ShiShen methods, which
// implement the standard 十神 derivation from the day master (日主):
//   - Same element, different polarity => 比肩 / 劫财
//   - Element the day master generates => 食神 / 伤官
//   - Element that controls the day master => 偏官(七杀) / 正官
//   - Element the day master controls => 偏财 / 正财
//   - Element that generates the day master => 偏印 / 正印
// Polarity (yin/yang) decides the "偏" (indirect) vs "正" (direct) half.
//
// The day stem's own ten god is reported by lunar-javascript as "日主"
// (day master) rather than 比肩; we surface it verbatim.

import { Solar, I18n } from 'lunar-javascript'
import type { BirthData } from '../../core/birth'
import type { PillarTenGods, TenGods } from './types'
import { resolveWallClock } from './four-pillars'

I18n.setLanguage('zh')

/**
 * Compute the ten gods for all four pillars. Each pillar reports the ten
 * god of its heavenly stem (relative to the day master) and the ten gods
 * of its branch's hidden stems.
 */
export function computeTenGods(data: BirthData): TenGods {
  const t = resolveWallClock(data)
  const solar = Solar.fromYmdHms(
    t.year,
    t.month,
    t.day,
    t.hour,
    t.minute,
    t.second,
  )
  const ec = solar.getLunar().getEightChar()
  const make = (
    stem: string,
    branches: string[],
  ): PillarTenGods => ({ stem, branches })
  return {
    year: make(ec.getYearShiShenGan(), ec.getYearShiShenZhi()),
    month: make(ec.getMonthShiShenGan(), ec.getMonthShiShenZhi()),
    day: make(ec.getDayShiShenGan(), ec.getDayShiShenZhi()),
    hour: make(ec.getTimeShiShenGan(), ec.getTimeShiShenZhi()),
  }
}
