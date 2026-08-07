// src/engines/bazi/luck-pillars.ts — 大運 (decade luck pillars).
//
// Delegates to `lunar-javascript` EightChar.getYun(gender).getDaYun(n),
// which implements the standard forward/backward 大運 calculation: a
// yang-stem-year male (or yin-stem-year female) counts forward to the
// next 节气; the reverse counts backward to the previous 节气. The day
// count divided by 3 gives the starting age (1 day = 4 months, per the
// traditional rule baked into lunar-javascript).
//
// The first DaYun entry (index 0) is the pre-大運 period — the years from
// birth to the first 大運 onset — and has an empty gan-zhi string. We keep
// it so callers can render the full age timeline.

import { Solar, I18n } from 'lunar-javascript'
import type { BirthData } from '../../core/birth'
import type { Gender, LuckPillar } from './types'
import { resolveWallClock } from './four-pillars'

I18n.setLanguage('zh')

/**
 * Compute the first `count` 大運 pillars (including the pre-大運 period at
 * index 0). `count` defaults to 8 (7 decades + the pre-period), covering
 * ages 1 through ~78.
 */
export function computeLuckPillars(
  data: BirthData,
  gender: Gender,
  count = 8,
): LuckPillar[] {
  const t = resolveWallClock(data)
  const solar = Solar.fromYmdHms(
    t.year,
    t.month,
    t.day,
    t.hour,
    t.minute,
    t.second,
  )
  const yun = solar.getLunar().getEightChar().getYun(gender, 2)
  const da = yun.getDaYun(count)
  return da.map((d) => ({
    ganZhi: d.getGanZhi(),
    startAge: d.getStartAge(),
    endAge: d.getEndAge(),
    startYear: d.getStartYear(),
    endYear: d.getEndYear(),
  }))
}
