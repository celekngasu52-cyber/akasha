/**
 * Swiss Ephemeris wrapper for akasha-astrology-engine.
 *
 * Provides an async-initialized singleton around `swisseph-wasm`, exposing
 * the small surface this engine needs:
 *   - planets()           : tropical or sidereal ecliptic longitudes
 *   - housesPlacidus()    : Placidus cusps with polar -> whole-sign fallback
 *   - ayanamsa()          : Lahiri ayanamsa via SE_SIDM_LAHIRI flag
 *
 * Ayanamsa is set via the SE_SIDM_LAHIRI flag (never a hardcoded number),
 * per the Swiss Ephemeris contract. Sidereal mode is selected per-call by
 * passing `{ sidereal: true }` to planets()/housesPlacidus().
 *
 * Polar fallback: Placidus is undefined for |lat| > ~66°. If |lat| > 66 OR
 * swe.houses() throws, the caller receives houseSystem 'WS' (whole sign)
 * and the result carries `polarFallback: true`.
 */
import SwissEph, { type HousesResult } from 'swisseph-wasm'

/** Body identifiers supported by planets(). */
export type PlanetId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'

/** Options for a planet-position calculation. */
export interface PlanetOptions {
  /** Sidereal (Lahiri) positions instead of tropical. Default false. */
  sidereal?: boolean
  /** Include speed values (longitude/distance speed). Default true. */
  speed?: boolean
}

/** A single body's ecliptic position, in degrees. */
export interface PlanetPosition {
  /** Body name. */
  planet: PlanetId
  /** Ecliptic longitude [0, 360). */
  longitude: number
  /** Ecliptic latitude. */
  latitude: number
  /** Distance in AU. */
  distance: number
  /** Longitude speed in deg/day. NaN when speed not requested. */
  longitudeSpeed: number
  /** Latitude speed in deg/day. NaN when speed not requested. */
  latitudeSpeed: number
  /** Distance speed in AU/day. NaN when speed not requested. */
  distanceSpeed: number
  /** Whether the position is sidereal (Lahiri). */
  sidereal: boolean
}

/** Result of a house-cusp calculation. */
export interface HousesResult2 {
  /** House system actually used: 'P' Placidus or 'WS' whole sign. */
  houseSystem: 'P' | 'WS'
  /** 12 cusps in degrees, index 0 = 1st house ... index 11 = 12th. */
  cusps: readonly number[]
  /** Ascendant (degrees). */
  ascendant: number
  /** Midheaven (degrees). */
  mc: number
  /** ARMC (degrees). */
  armc: number
  /** Vertex (degrees). */
  vertex: number
  /** True if Placidus was unavailable and whole-sign fallback was used. */
  polarFallback: boolean
}

/** Absolute latitude beyond which Placidus is undefined (polar circles). */
const POLAR_LIMIT_LAT = 66

/** Map of public body names to SwissEph integer IDs. */
const PLANET_IDS: Readonly<Record<PlanetId, number>> = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  uranus: 7,
  neptune: 8,
  pluto: 9,
}

let sweInstance: SwissEph | null = null
let initPromise: Promise<SwissEph> | null = null
let sidModeConfigured = false

/**
 * Returns the shared, initialized SwissEph instance.
 *
 * `initSwissEph()` is async (loads the WASM module) and is invoked exactly
 * once across the process; concurrent callers await the same promise. The
 * Lahiri sidereal mode is configured once after init so later sidereal
 * calls do not need to reconfigure.
 */
export async function getSwissEph(): Promise<SwissEph> {
  if (sweInstance) return sweInstance
  if (!initPromise) {
    initPromise = (async () => {
      const swe = new SwissEph()
      await swe.initSwissEph()
      swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0)
      sidModeConfigured = true
      sweInstance = swe
      return swe
    })()
  }
  return initPromise
}

/**
 * Compute ecliptic positions for the given bodies at Julian Day (UT).
 *
 * `jd` is a UT Julian Day (the day number passed to SwissEph calc_ut).
 * Sidereal mode adds SEFLG_SIDEREAL; Lahiri is already configured on the
 * singleton via SE_SIDM_LAHIRI, so no numeric ayanamsa is hardcoded here.
 *
 * Returns one PlanetPosition per requested body, in input order.
 */
export async function planets(
  jd: number,
  bodies: readonly PlanetId[],
  options: PlanetOptions = {},
): Promise<PlanetPosition[]> {
  const swe = await getSwissEph()
  const sidereal = options.sidereal === true
  const speed = options.speed !== false
  let flags = swe.SEFLG_SWIEPH
  if (speed) flags |= swe.SEFLG_SPEED
  if (sidereal) flags |= swe.SEFLG_SIDEREAL
  return bodies.map((name) => toPosition(swe, name, jd, flags, sidereal))
}

/**
 * Lahiri ayanamsa (degrees) at Julian Day (UT).
 *
 * Computed by SwissEph from the SE_SIDM_LAHIRI configuration; the numeric
 * value is never hardcoded.
 */
export async function ayanamsa(jd: number): Promise<number> {
  const swe = await getSwissEph()
  if (!sidModeConfigured) {
    swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0)
    sidModeConfigured = true
  }
  return swe.get_ayanamsa_ut(jd)
}

/**
 * Placidus house cusps with a polar -> whole-sign fallback.
 *
 * `jd` is a UT Julian Day. If |lat| > 66 or Placidus computation throws,
 * the result switches to whole-sign houses ('WS') and carries
 * `polarFallback: true`. The fallback is a deterministic contract: callers
 * can branch on `polarFallback` to flag charts that left the Placidus grid.
 *
 * @param jd       UT Julian Day.
 * @param lat      Geographic latitude in degrees.
 * @param lng      Geographic longitude in degrees (east positive).
 * @param sidereal When true, compute sidereal houses (Lahiri).
 */
export async function housesPlacidus(
  jd: number,
  lat: number,
  lng: number,
  sidereal = false,
): Promise<HousesResult2> {
  const swe = await getSwissEph()
  const polarFallbackNeeded = Math.abs(lat) > POLAR_LIMIT_LAT
  if (polarFallbackNeeded) {
    return wholeSignHouses(swe, jd, lat, lng, sidereal, true)
  }
  try {
    const result = sidereal
      ? swe.houses_ex(
          jd,
          swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL,
          lat,
          lng,
          'P',
        )
      : swe.houses(jd, lat, lng, 'P')
    return toHousesResult(result, 'P', false)
  } catch {
    return wholeSignHouses(swe, jd, lat, lng, sidereal, true)
  }
}

function toPosition(
  swe: SwissEph,
  name: PlanetId,
  jd: number,
  flags: number,
  sidereal: boolean,
): PlanetPosition {
  const out = swe.calc_ut(jd, PLANET_IDS[name], flags)
  return {
    planet: name,
    longitude: out[0],
    latitude: out[1],
    distance: out[2],
    longitudeSpeed: flags & swe.SEFLG_SPEED ? out[3] : Number.NaN,
    latitudeSpeed: flags & swe.SEFLG_SPEED ? out[4] : Number.NaN,
    distanceSpeed: flags & swe.SEFLG_SPEED ? out[5] : Number.NaN,
    sidereal,
  }
}

function wholeSignHouses(
  swe: SwissEph,
  jd: number,
  lat: number,
  lng: number,
  sidereal: boolean,
  polarFallback: boolean,
): HousesResult2 {
  const result = sidereal
    ? swe.houses_ex(
        jd,
        swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL,
        lat,
        lng,
        'W',
      )
    : swe.houses(jd, lat, lng, 'W')
  return toHousesResult(result, 'WS', polarFallback)
}

function toHousesResult(
  raw: HousesResult,
  houseSystem: 'P' | 'WS',
  polarFallback: boolean,
): HousesResult2 {
  const cusps: number[] = []
  for (let i = 1; i <= 12; i++) cusps.push(raw.cusps[i])
  return {
    houseSystem,
    cusps,
    ascendant: raw.ascmc[0],
    mc: raw.ascmc[1],
    armc: raw.ascmc[2],
    vertex: raw.ascmc[3],
    polarFallback,
  }
}
