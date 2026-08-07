// src/engines/vedic/chart.ts — Vedic chart assembly + vimshottari dasha.
//
// Orchestrates the sidereal primitives (jdUTFromBirth, siderealAscendant,
// siderealPlanets, toSiderealPosition) into a VedicChart matching the golden
// fixture shape. The dasha sequence follows the standard vimshottari rule:
// the moon's nakshatra lord is the first maha-dasha lord; the fraction of
// the nakshatra already traversed by the moon determines how much of that
// first period elapsed before birth. The first period is back-dated to its
// true start; subsequent periods are full duration in DASHA_SEQUENCE order.

import type { BirthData } from '../../core/birth'
import { ayanamsa } from '../../ephemeris/swisseph'
import type { VedicChart, DashaPeriod, SiderealPosition } from './types'
import { NAKSHATRA_LORDS } from './types'
import {
  jdUTFromBirth,
  siderealAscendant,
  siderealPlanets,
  toSiderealPosition,
  DASHA_SEQUENCE,
  DASHA_YEARS,
  DASHA_TOTAL_YEARS,
} from './sidereal'

/** One nakshatra spans 13°20' = 13 + 1/3 degrees. */
const NAK_DEG = 13 + 1 / 3

/** Milliseconds per day (used for dasha date arithmetic). */
const MS_PER_DAY = 86_400_000

/** Days per year (Julian year, the vimshottari convention). */
const DAYS_PER_YEAR = 365.25

/**
 * Add a (possibly fractional) number of years to a UTC ms instant, using
 * calendar-year arithmetic for the integer part and day-based arithmetic
 * for the fractional remainder. This matches prokerala's dasha boundary
 * convention (integer-year steps land on the same month/day).
 */
function addYears(ms: number, years: number): number {
  const d = new Date(ms)
  const wholeYears = Math.trunc(years)
  const fracYears = years - wholeYears
  const withWhole = Date.UTC(
    d.getUTCFullYear() + wholeYears,
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds(),
  )
  return withWhole + fracYears * DAYS_PER_YEAR * MS_PER_DAY
}

/**
 * Compute the vimshottari maha-dasha sequence for a birth.
 *
 * The first period is the moon's nakshatra lord's dasha, back-dated to its
 * true start (the moon had already traversed a fraction of the nakshatra at
 * birth, so a proportional fraction of the dasha had already elapsed). The
 * remaining 8 periods follow in DASHA_SEQUENCE order at full duration.
 *
 * @param moonSidereal  Moon's full sidereal position (needs longitudeDeg +
 *                      nakshatraIndex, both populated by toSiderealPosition).
 * @param birthMs       Birth instant as UTC milliseconds (Date.getTime()).
 * @returns 9 DashaPeriod entries; first is back-dated, total spans 120 years.
 */
export function computeVimshottari(
  moonSidereal: SiderealPosition,
  birthMs: number,
): DashaPeriod[] {
  const nakIdx = moonSidereal.nakshatraIndex
  if (nakIdx === undefined) {
    throw new Error('moon sidereal position missing nakshatraIndex')
  }
  const firstLord = NAKSHATRA_LORDS[nakIdx]
  const startSeqIdx = DASHA_SEQUENCE.indexOf(
    firstLord as (typeof DASHA_SEQUENCE)[number],
  )
  if (startSeqIdx < 0) {
    throw new Error(`nakshatra lord ${firstLord} not in DASHA_SEQUENCE`)
  }
  // Fraction of the nakshatra already traversed by the moon at birth.
  const nakStartLon = nakIdx * NAK_DEG
  const elapsedFrac =
    (moonSidereal.longitudeDeg - nakStartLon) / NAK_DEG
  // First lord's full duration; the elapsed portion is before birth.
  const firstFullYears = DASHA_YEARS[startSeqIdx]
  const elapsedYears = elapsedFrac * firstFullYears
  const firstStartMs = addYears(birthMs, -elapsedYears)
  const firstEndMs = addYears(firstStartMs, firstFullYears)
  const periods: DashaPeriod[] = [
    {
      lord: firstLord,
      startISO: isoDate(firstStartMs),
      endISO: isoDate(firstEndMs),
      durationYears: firstFullYears,
    },
  ]
  // Subsequent 8 periods in DASHA_SEQUENCE order (wrapping).
  let cursorMs = firstEndMs
  for (let i = 1; i < DASHA_SEQUENCE.length; i++) {
    const seqIdx = (startSeqIdx + i) % DASHA_SEQUENCE.length
    const lord = DASHA_SEQUENCE[seqIdx]
    const years = DASHA_YEARS[seqIdx]
    const endMs = addYears(cursorMs, years)
    periods.push({
      lord,
      startISO: isoDate(cursorMs),
      endISO: isoDate(endMs),
      durationYears: years,
    })
    cursorMs = endMs
  }
  return periods
}

/**
 * Compute the full Vedic (sidereal) chart for a birth.
 *
 * Assembles lagna, moon, all planet positions, and the vimshottari dasha
 * sequence into the VedicChart shape. Pure and deterministic: same BirthData
 * -> same output, because swisseph-wasm is deterministic given a UT JD.
 */
export async function computeVedicChart(
  data: BirthData,
): Promise<VedicChart> {
  const jdUT = await jdUTFromBirth(data)
  const [ascLon, planetRows, ayanDeg] = await Promise.all([
    siderealAscendant(jdUT, data.lat, data.lng),
    siderealPlanets(jdUT),
    ayanamsa(jdUT),
  ])
  const lagna = toSiderealPosition('ascendant', ascLon)
  const planetsOut: SiderealPosition[] = planetRows.map((r) =>
    toSiderealPosition(r.body, r.longitudeDeg, r.retrograde),
  )
  const moon = planetsOut.find((p) => p.body === 'moon')
  if (!moon) throw new Error('moon not found in sidereal planets')
  // Birth instant in UTC ms for dasha date arithmetic. jdUT is a UT Julian
  // Day; convert to JS epoch ms via the standard (jd - 2440587.5) * 86400000.
  const birthMs = (jdUT - 2_440_587.5) * MS_PER_DAY
  const dasha = computeVimshottari(moon, birthMs)
  return {
    birthDateISO: data.dateISO,
    birthTimeISO: data.timeISO ?? '',
    tzIANA: data.tzIANA,
    lat: data.lat,
    lng: data.lng,
    ayanamsaDeg: ayanDeg,
    jdUT,
    lagna,
    moon,
    planets: planetsOut,
    dasha,
  }
}

/** Format a UTC millisecond instant as an ISO date (yyyy-mm-dd). */
function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

// Re-export DASHA_TOTAL_YEARS so callers can validate the cycle length
// without importing from two modules.
export { DASHA_TOTAL_YEARS }
