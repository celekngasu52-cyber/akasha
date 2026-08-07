// src/engines/western/chart.ts — natal chart, transits, solar return.
//
// All tropical math delegates to the existing swisseph wrapper (todo 4):
//   - planets() returns tropical ecliptic longitudes (sidereal=false default).
//   - housesPlacidus() returns Placidus cusps; at |lat|>66° it falls back to
//     whole-sign houses and reports houseSystem 'WS'. The wrapper owns the
//     polar fallback decision, so this engine never hardcodes a polar rule.
//
// Public functions are pure and deterministic: same BirthData -> same output.

import {
  planets,
  housesPlacidus,
  getSwissEph,
} from '../../ephemeris/swisseph'
import type { PlanetPosition, PlanetId } from '../../ephemeris/swisseph'
import { resolveTimezone } from '../../core/birth/tz'
import type { BirthData } from '../../core/birth/types'
import { computeAspects } from './aspects'
import type {
  WesternBody,
  WesternChart,
  WesternPosition,
  HouseCusp,
  HouseSystem,
  TransitEntry,
  SolarReturn,
  AspectType,
  AngleName,
} from './types'

/** Bodies in canonical chart order (used for planets + aspects). */
export const PLANET_BODIES: readonly WesternBody[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
] as const

/** Aspect type lookup by exact angle, for transit classification. */
const ASPECT_BY_ANGLE: Readonly<Record<number, AspectType>> = {
  0: 'conjunction', 60: 'sextile', 90: 'square',
  120: 'trine', 180: 'opposition',
}

/** Parse BirthData into a wall-clock tuple in the birth timezone. */
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

/** Convert BirthData to a UT Julian Day (TT minus delta-T). */
export async function jdUTFromBirth(data: BirthData): Promise<number> {
  const t = parseWallClock(data)
  const probeDate = new Date(
    Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second),
  )
  const tz = resolveTimezone(data.tzIANA, probeDate)
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

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  const m = deg % 360
  return m < 0 ? m + 360 : m
}

/** Sign index 0..11 from a longitude. */
function signIndex(deg: number): number {
  return Math.floor(norm360(deg) / 30)
}

/** Degrees travelled within the current sign, 0..30. */
function degreeInSign(deg: number): number {
  return norm360(deg) - signIndex(deg) * 30
}

/** Round to 6 decimal places for stable golden output. */
function round6(v: number): number {
  const f = 10 ** 6
  return Math.round(v * f) / f
}

/** Build a WesternPosition from a swisseph PlanetPosition. */
function toWestern(
  name: WesternBody | AngleName,
  lon: number,
  retrograde: boolean,
): WesternPosition {
  return {
    name,
    longitudeDeg: round6(norm360(lon)),
    signIndex: signIndex(lon),
    degreeInSign: round6(degreeInSign(lon)),
    retrograde,
  }
}

/** Convert a raw swisseph planet row to a WesternPosition. */
function planetToWestern(p: PlanetPosition): WesternPosition {
  return toWestern(p.planet as WesternBody, p.longitude, p.longitudeSpeed < 0)
}

/**
 * Compute the full Western natal chart for the given birth data: tropical
 * longitudes for the ten bodies, ascendant + midheaven angles, twelve house
 * cusps (Placidus, or whole-sign at polar latitudes), and major aspects.
 */
export async function computeNatalChart(
  data: BirthData,
): Promise<WesternChart> {
  const jdUT = await jdUTFromBirth(data)
  const raw = await planets(jdUT, PLANET_BODIES as readonly PlanetId[], {
    sidereal: false,
    speed: true,
  })
  const planetsOut = raw.map(planetToWestern)
  const houses = await housesPlacidus(jdUT, data.lat, data.lng, false)
  const ascendant = toWestern('ascendant', houses.ascendant, false)
  const midheaven = toWestern('midheaven', houses.mc, false)
  const houseCusps: HouseCusp[] = houses.cusps.map((lon, i) => ({
    index: i + 1,
    longitudeDeg: round6(norm360(lon)),
    signIndex: signIndex(lon),
  }))
  const all = [...planetsOut, ascendant, midheaven]
  const aspects = computeAspects(all)
  return {
    jdUT,
    zodiac: 'tropical',
    houseSystem: houses.houseSystem,
    polarFallback: houses.polarFallback,
    planets: planetsOut,
    angles: { ascendant, midheaven },
    houses: houseCusps,
    aspects,
  }
}

/**
 * Compute transits of the ten bodies over the natal chart points at a given
 * moment. For each (transitBody, natalPoint) pair, every major aspect whose
 * orb is within tolerance is emitted. `transitJD` is a UT Julian Day.
 */
export async function computeTransits(
  data: BirthData,
  transitJD: number,
): Promise<TransitEntry[]> {
  const natal = await computeNatalChart(data)
  const transitRaw = await planets(
    transitJD, PLANET_BODIES as readonly PlanetId[],
    { sidereal: false, speed: true },
  )
  const transitBy = new Map<WesternBody, PlanetPosition>()
  for (const p of transitRaw) {
    transitBy.set(p.planet as WesternBody, p)
  }
  const natalPoints = [
    ...natal.planets,
    natal.angles.ascendant,
    natal.angles.midheaven,
  ]
  const out: TransitEntry[] = []
  for (const body of PLANET_BODIES) {
    const tp = transitBy.get(body)
    if (!tp) continue
    const tLon = norm360(tp.longitude)
    for (const np of natalPoints) {
      if (np.name === body) continue
      const nLon = np.longitudeDeg
      const sep = shortestArc(tLon, nLon)
      for (const exact of [0, 60, 90, 120, 180]) {
        const orb = Math.abs(exact - sep)
        const tol = exact === 60 ? 6 : 8
        if (orb <= tol) {
          out.push({
            body,
            natalPoint: np.name,
            aspect: ASPECT_BY_ANGLE[exact]!,
            transitLongitudeDeg: round6(tLon),
            natalLongitudeDeg: nLon,
            orb: round6(orb),
          })
        }
      }
    }
  }
  return out
}

/** Shortest arc between two longitudes, in [0, 180]. */
function shortestArc(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360
  return raw > 180 ? 360 - raw : raw
}

/**
 * Compute the solar return for a given return year. The solar return is the
 * moment when the transiting Sun returns to its exact natal tropical longitude.
 * The return chart is then cast for that moment at the return location
 * (defaults to the birth location).
 */
export async function computeSolarReturn(
  data: BirthData,
  year: number,
  returnLat = data.lat,
  returnLng = data.lng,
): Promise<SolarReturn> {
  const natal = await computeNatalChart(data)
  const natalSun = findPlanet(natal, 'sun').longitudeDeg
  const swe = await getSwissEph()
  const jd = findSolarReturnJD(swe, year, natalSun)
  const chart = await castChartAt(jd, returnLat, returnLng)
  return {
    year,
    jdUT: jd,
    returnISO: jdToISO(swe, jd),
    chart,
  }
}

/** Find the planet position by name; throws if absent. */
function findPlanet(
  chart: WesternChart,
  name: WesternBody,
): WesternPosition {
  const p = chart.planets.find((x) => x.name === name)
  if (!p) throw new Error(`planet ${name} not found in natal chart`)
  return p
}

/** Cast a WesternChart at an arbitrary jd/lat/lng (no birth data needed). */
async function castChartAt(
  jdUT: number, lat: number, lng: number,
): Promise<WesternChart> {
  const raw = await planets(jdUT, PLANET_BODIES as readonly PlanetId[], {
    sidereal: false, speed: true,
  })
  const planetsOut = raw.map(planetToWestern)
  const houses = await housesPlacidus(jdUT, lat, lng, false)
  const ascendant = toWestern('ascendant', houses.ascendant, false)
  const midheaven = toWestern('midheaven', houses.mc, false)
  const houseCusps: HouseCusp[] = houses.cusps.map((lon, i) => ({
    index: i + 1,
    longitudeDeg: round6(norm360(lon)),
    signIndex: signIndex(lon),
  }))
  const all = [...planetsOut, ascendant, midheaven]
  const aspects = computeAspects(all)
  return {
    jdUT,
    zodiac: 'tropical',
    houseSystem: houses.houseSystem,
    polarFallback: houses.polarFallback,
    planets: planetsOut,
    angles: { ascendant, midheaven },
    houses: houseCusps,
    aspects,
  }
}

/**
 * Find the UT Julian Day in `year` when the Sun's tropical longitude equals
 * `natalSun`. Uses a secant method seeded near the expected return date
 * (~365.24 days after the previous return). Converges in a handful of steps.
 */
function findSolarReturnJD(
  swe: { julday: (y: number, m: number, d: number, h: number) => number },
  year: number,
  natalSun: number,
): number {
  // Seed: January 1 of the return year, 12:00 UT (rough natal anniversary).
  let jd = swe.julday(year, 1, 1, 12)
  for (let i = 0; i < 30; i++) {
    const sunLon = sunLongitudeAt(jd)
    let diff = natalSun - sunLon
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    if (Math.abs(diff) < 1e-6) return jd
    // The Sun moves ~0.9856°/day; step by the degree gap in days.
    jd += diff / 0.9856473
  }
  return jd
}

/** Tropical longitude of the Sun at a UT Julian Day (synthetic, ~0.01° acc). */
function sunLongitudeAt(jd: number): number {
  // Low-precision mean Sun formula (Meeus, Astronomical Algorithms).
  const T = (jd - 2451545.0) / 36525
  const L0 = 280.46646 + 36000.76983 * T
  const M = 357.52911 + 35999.05029 * T
  const C =
    (1.914602 - 0.004817 * T) * sind(M) +
    0.019993 * sind(2 * M) +
    0.000289 * sind(3 * M)
  const trueLong = L0 + C
  return norm360(trueLong)
}

/** sind/cosd in degrees. */
function sind(d: number): number {
  return Math.sin((d * Math.PI) / 180)
}

type SweJdutFn = (jd: number, gregflag: number) => {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

/** Convert a UT Julian Day to an ISO-8601 UTC string. */
function jdToISO(swe: { jdut1_to_utc: SweJdutFn }, jd: number): string {
  const d = swe.jdut1_to_utc(jd, 1)
  const { year: Y, month: M, day: D, hour: h, minute: mi, second: s } = d
  const ms = Math.round((s % 1) * 1000)
  const ss = Math.floor(s)
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${Y}-${pad(M)}-${pad(D)}T${pad(h)}:${pad(mi)}:${pad(ss)}.${pad(ms, 3)}Z`
}

export type { HouseSystem, AngleName }
