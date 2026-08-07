// src/engines/bazi/four-pillars.ts — compute the four pillars (年月日時)
// from a BirthData value via `lunar-javascript` EightChar.
//
// The boundary contract: BirthData (dateISO + timeISO + tzIANA) is parsed
// exactly once into a {y,m,d,h,mi,s} wall-clock tuple in the birth timezone,
// then handed to Solar.fromYmdHms. This avoids the system-timezone trap:
// `Solar.fromDate(jsDate)` reads the runtime's local components, which would
// make the chart depend on the host machine. fromYmdHms is explicit.

import { Solar, I18n } from 'lunar-javascript'
import type { BirthData } from '../../core/birth'
import type { FourPillars, Pillar, ResolvedTime } from './types'

// Force Chinese-character output once at module load. lunar-javascript
// defaults to templated i18n keys (e.g. "{tg.jia}"); 'zh' resolves them.
I18n.setLanguage('zh')

/**
 * Build a four-pillar chart from validated BirthData. Gender is irrelevant
 * to the pillars themselves; it only enters 大運 computation (see
 * luck-pillars.ts). Returns exact gan-zhi strings from EightChar.
 */
export function computeFourPillars(data: BirthData): FourPillars {
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
  return {
    year: pillar(ec.getYear()),
    month: pillar(ec.getMonth()),
    day: pillar(ec.getDay()),
    hour: pillar(ec.getTime()),
  }
}

/** Split a "庚午" pillar into its stem and branch halves. */
function pillar(ganZhi: string): Pillar {
  return {
    ganZhi,
    stem: ganZhi.length >= 1 ? ganZhi.charAt(0) : '',
    branch: ganZhi.length >= 2 ? ganZhi.charAt(1) : '',
  }
}

/**
 * Parse BirthData into a wall-clock {y,m,d,h,mi,s} tuple in the birth
 * timezone. This is the single boundary parse for the whole BaZi engine;
 * downstream code receives typed values and never re-parses.
 *
 * BirthData already carries the local wall-clock time as dateISO/timeISO
 * strings (the time the clock showed at the birth place), and
 * Solar.fromYmdHms consumes exactly those local components. No UTC shift
 * is applied: shifting through Date.UTC + offset would invert the hour
 * for every non-UTC zone (the offset would be applied to components that
 * Date.UTC already treats as UTC, double-counting it). The tzIANA field
 * is preserved on BirthData for the swisseph/astrology side, which does
 * need a UTC instant; the BaZi pillars do not.
 */
export function resolveWallClock(data: BirthData): ResolvedTime & {
  year: number
  month: number
  day: number
} {
  const [y, mo, d] = data.dateISO.split('-').map(Number)
  let hour = 0
  let minute = 0
  let second = 0
  if (data.timeISO !== null) {
    const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(data.timeISO)
    // validateBirthData already enforced the shape; match is non-null.
    if (m) {
      hour = Number(m[1])
      minute = Number(m[2])
      second = m[3] === undefined ? 0 : Number(m[3])
    }
  }
  return { year: y, month: mo, day: d, hour, minute, second }
}
