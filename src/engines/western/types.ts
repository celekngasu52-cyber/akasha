// src/engines/western/types.ts — shared types for the Western (tropical) engine.
//
// The engine computes tropical ecliptic longitudes, Placidus houses (with a
// whole-sign fallback at |lat|>66°), major Ptolemaic aspects, transits, and a
// solar return. All public functions are pure and deterministic: same BirthData
// -> same output, because swisseph-wasm is deterministic given a UT Julian Day.
//
// The chart shape mirrors the golden fixture in tests/golden/western/case1.json.

/** The ten classical + modern bodies used in a Western natal chart. */
export type WesternBody =
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

/** A point in the chart that is not a physical body (angles). */
export type AngleName = 'ascendant' | 'midheaven'

/** A planet or angle with its tropical longitude and motion state. */
export interface WesternPosition {
  /** Body or angle name. */
  name: WesternBody | AngleName
  /** Tropical ecliptic longitude in degrees, normalised to [0, 360). */
  longitudeDeg: number
  /** Sign index 0..11 (Aries=0, ..., Pisces=11). */
  signIndex: number
  /** Degrees travelled within the current sign, 0..30. */
  degreeInSign: number
  /** True when the body is retrograde (negative longitude speed). */
  retrograde: boolean
}

/** House system reported for the chart. 'P' = Placidus, 'WS' = whole-sign. */
export type HouseSystem = 'P' | 'WS'

/** A single Placidus (or whole-sign) house cusp, 1-indexed. */
export interface HouseCusp {
  /** House number 1..12. */
  index: number
  /** Cusp longitude in degrees, [0, 360). */
  longitudeDeg: number
  /** Sign index 0..11 that the cusp falls in. */
  signIndex: number
}

/** Aspect types used by the western engine. */
export type AspectType =
  | 'conjunction'
  | 'opposition'
  | 'square'
  | 'trine'
  | 'sextile'

/** One computed aspect between two chart points. */
export interface Aspect {
  /** First body or angle. */
  bodyA: WesternBody | AngleName
  /** Second body or angle. */
  bodyB: WesternBody | AngleName
  /** Aspect classification. */
  type: AspectType
  /** Exact angle of the aspect in degrees (0, 60, 90, 120, 180). */
  exactAngle: number
  /** Actual angular separation between the two bodies, [0, 180]. */
  actualSeparation: number
  /** Absolute orb in degrees (|exact - actual|). */
  orb: number
}

/** A complete Western natal chart. */
export interface WesternChart {
  /** UT Julian Day used for the chart computation. */
  jdUT: number
  /** Zodiac mode (always tropical for the western engine). */
  zodiac: 'tropical'
  /** House system actually applied ('P' or 'WS' when polar). */
  houseSystem: HouseSystem
  /** True when Placidus was unavailable and whole-sign fallback was used. */
  polarFallback: boolean
  /** Positions of the ten bodies, in PLANET_BODIES order. */
  planets: WesternPosition[]
  /** Ascendant and midheaven angles. */
  angles: { ascendant: WesternPosition; midheaven: WesternPosition }
  /** The twelve house cusps (1-indexed). */
  houses: HouseCusp[]
  /** Major aspects between the bodies and angles. */
  aspects: Aspect[]
}

/** A transit of a moving body over a natal point, with its type. */
export interface TransitEntry {
  /** Body whose transit is computed. */
  body: WesternBody
  /** Natal point being aspected. */
  natalPoint: WesternBody | AngleName
  /** Transit-to-natal aspect classification. */
  aspect: AspectType
  /** Transit longitude at the moment, in degrees. */
  transitLongitudeDeg: number
  /** Natal longitude of the point, in degrees. */
  natalLongitudeDeg: number
  /** Orb of the transit aspect in degrees. */
  orb: number
}

/** A solar return chart for a given return year. */
export interface SolarReturn {
  /** The return year (calendar year when the Sun returns to its natal place). */
  year: number
  /** UT Julian Day of the solar return. */
  jdUT: number
  /** ISO-8601 UTC date-time of the return. */
  returnISO: string
  /** The solar return chart cast for the return location. */
  chart: WesternChart
}
