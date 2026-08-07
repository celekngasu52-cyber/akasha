// src/engines/vedic/sidereal.ts — sidereal positions, lagna, rasi, nakshatra.
//
// All sidereal math delegates to the existing swisseph wrapper (todo 4):
//   - planets() with { sidereal: true } returns Lahiri-corrected longitudes.
//   - housesPlacidus() returns the ascendant (tropical), which we shift to
//     sidereal by subtracting ayanamsa(). We do NOT call housesPlacidus with
//     sidereal=true because the wrapper does not expose a sidereal-houses
//     flag; the standard Vedic convention is tropical-ascendant minus
//     ayanamsa, which prokerala also follows.
//   - ayanamsa() returns the Lahiri value at the UT Julian Day.
//
// JD UT is computed from BirthData by interpreting the wall-clock {y,m,d,h,mi,s}
// in the birth IANA timezone, resolving the UTC offset, and converting to a
// UT instant. swisseph then converts UT to TT internally via deltat().

import type { BirthData } from '../../core/birth'
import { resolveTimezone } from '../../core/birth'
import { getSwissEph, planets, housesPlacidus, ayanamsa } from '../../ephemeris/swisseph'
import type { PlanetId, PlanetPosition } from '../../ephemeris/swisseph'
import type {
  VedicBody, SiderealPosition, RasiIndex, NakshatraIndex, Pada,
} from './types'
import {
  RASI_NAMES, RASI_LORDS, NAKSHATRA_NAMES, NAKSHATRA_LORDS,
} from './types'

/** Bodies computed via swisseph planets(). Rahu/Ketu are mean nodes. */
const PLANET_BODIES: readonly PlanetId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
]

/** The vimshottari dasha sequence (lord order) starting from Ketu. */
export const DASHA_SEQUENCE = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn',
  'Mercury',
] as const

/** Maha-dasha durations in years, indexed to match DASHA_SEQUENCE. */
export const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17] as const

/** Total vimshottari cycle length in years (120). */
export const DASHA_TOTAL_YEARS = 120

/**
 * Compute the UT Julian Day for a BirthData value.
 *
 * The wall-clock {y,m,d,h,mi,s} is interpreted in tzIANA; the UTC offset is
 * resolved via Intl, and the resulting UTC instant is converted to JD UT
 * using swisseph's julday() + deltat() correction.
 */
export async function jdUTFromBirth(data: BirthData): Promise<number> {
  const t = parseWallClock(data)
  // Probe the offset at the wall-clock instant (interpreted as UTC).
  const probeDate = new Date(
    Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second),
  )
  const tz = resolveTimezone(data.tzIANA, probeDate)
  // local wall-clock = UTC + offset => UTC = local - offset (in ms).
  const utcMs = probeDate.getTime() - tz.offsetMinutes * 60_000
  const utcDate = new Date(utcMs)
  const swe = await getSwissEph()
  const y = utcDate.getUTCFullYear()
  const mo = utcDate.getUTCMonth() + 1
  const d = utcDate.getUTCDate()
  const h =
    utcDate.getUTCHours() +
    utcDate.getUTCMinutes() / 60 +
    utcDate.getUTCSeconds() / 3600
  const jdTT = swe.julday(y, mo, d, h)
  return jdTT - swe.deltat(jdTT) / 86400
}

/** Parse BirthData into a wall-clock {y,m,d,h,mi,s} tuple in tzIANA. */
function parseWallClock(data: BirthData): {
  year: number; month: number; day: number
  hour: number; minute: number; second: number
} {
  const [y, mo, d] = data.dateISO.split('-').map(Number)
  let hour = 12, minute = 0, second = 0
  if (data.timeISO) {
    const parts = data.timeISO.split(':').map(Number)
    hour = parts[0] ?? 12
    minute = parts[1] ?? 0
    second = parts[2] ?? 0
  }
  return { year: y, month: mo, day: d, hour, minute, second }
}

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  const m = deg % 360
  return m < 0 ? m + 360 : m
}

/** Compute the sidereal ascendant (lagna) longitude at jdUT + location. */
export async function siderealAscendant(
  jdUT: number,
  lat: number,
  lng: number,
): Promise<number> {
  const houses = await housesPlacidus(jdUT, lat, lng)
  // tropical ascendant; shift to sidereal by subtracting Lahiri ayanamsa.
  const ayan = await ayanamsa(jdUT)
  return norm360(houses.ascendant - ayan)
}

/** Compute sidereal positions of all planets + Rahu/Ketu at jdUT. */
export async function siderealPlanets(jdUT: number): Promise<
  { body: VedicBody; longitudeDeg: number; retrograde: boolean }[]
> {
  const pos = await planets(jdUT, PLANET_BODIES, { sidereal: true, speed: true })
  const out = pos.map((p) => ({
    body: p.planet as VedicBody,
    longitudeDeg: norm360(p.longitude),
    retrograde: p.longitudeSpeed < 0,
  }))
  // Mean Rahu (north node): swisseph MEAN_NODE via the singleton directly.
  const swe = await getSwissEph()
  const SEFLG_SWIEPH = swe.SEFLG_SWIEPH
  const SEFLG_SIDEREAL = swe.SEFLG_SIDEREAL
  const MEAN_NODE = swe.MEAN_NODE ?? 11 // swisseph-wasm constant; 11 = mean node
  const rahuRaw = swe.calc_ut(jdUT, MEAN_NODE, SEFLG_SWIEPH | SEFLG_SIDEREAL)
  const rahuLon = norm360(rahuRaw.longitude ?? rahuRaw[0])
  const rahuSpeed = rahuRaw.longitudeSpeed ?? rahuRaw[3]
  out.push({
    body: 'rahu' as VedicBody,
    longitudeDeg: rahuLon,
    retrograde: rahuSpeed < 0,
  })
  // Ketu is exactly 180° opposite Rahu.
  out.push({
    body: 'ketu' as VedicBody,
    longitudeDeg: norm360(rahuLon + 180),
    retrograde: rahuSpeed < 0,
  })
  return out
}

/** Decompose a sidereal longitude into a full SiderealPosition. */
export function toSiderealPosition(
  body: VedicBody,
  longitudeDeg: number,
  retrograde = false,
): SiderealPosition {
  const lon = norm360(longitudeDeg)
  const rasiIndex = Math.floor(lon / 30) as RasiIndex
  const degInRasi = lon - rasiIndex * 30
  const nakshatraIndex = Math.floor(lon / (13 + 1 / 3)) as NakshatraIndex
  const padaOffset = lon - nakshatraIndex * (13 + 1 / 3)
  const pada = (Math.floor(padaOffset / (3 + 1 / 3)) + 1) as Pada
  const base: SiderealPosition = {
    body,
    longitudeDeg: round(lon, 6),
    degInRasi: round(degInRasi, 6),
    rasiIndex,
    rasiName: RASI_NAMES[rasiIndex],
    rasiLord: RASI_LORDS[rasiIndex],
    retrograde: retrograde || undefined,
  }
  // Ascendant: prokerala does not report nakshatra for the lagna in the
  // rasi table, but we compute it anyway for completeness (the lagna DOES
  // have a nakshatra in Vedic tradition; prokerala just omits it from the
  // main table). We include it.
  base.nakshatraIndex = nakshatraIndex
  base.nakshatraName = NAKSHATRA_NAMES[nakshatraIndex]
  base.nakshatraLord = NAKSHATRA_LORDS[nakshatraIndex]
  base.pada = pada
  return base
}

/** Round to n decimal places. */
function round(n: number, dp: number): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

/** Find the planet in a PlanetPosition[] by name. */
export function findPlanet(
  pos: PlanetPosition[],
  name: PlanetId,
): PlanetPosition {
  const p = pos.find((x) => x.planet === name)
  if (!p) throw new Error(`planet ${name} not found in positions`)
  return p
}
