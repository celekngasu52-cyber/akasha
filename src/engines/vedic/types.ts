// src/engines/vedic/types.ts — shared types for the Vedic (sidereal) engine.
//
// The engine computes sidereal (Lahiri) planet positions, lagna (ascendant),
// rasi (moon sign), nakshatra+pada, vimshottari maha-dasha, transit overlay,
// and sidereal solar return. All public functions are pure and deterministic:
// same BirthData -> same output, because swisseph-wasm is deterministic given
// a UT Julian Day.
//
// The chart shape mirrors the golden fixture in tests/golden/vedic/case1.json.

/** A planet or point in the Vedic chart. Rahu/Ketu are shadow planets. */
export type VedicBody =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'rahu'
  | 'ketu'
  | 'ascendant'

/** A sidereal zodiac sign (rasi), 0-indexed from Mesha (Aries). */
export type RasiIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

/** The 12 sidereal rasi names in order from 0=Aries. */
export const RASI_NAMES = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanus', 'Makara', 'Kumbha', 'Meena',
] as const

/** Lord of each rasi, indexed by RasiIndex. */
export const RASI_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
] as const

/** Nakshatra index, 0-indexed from Ashwini (0). 27 nakshatras total. */
export type NakshatraIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
  | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26

/** Lord of each nakshatra, indexed by NakshatraIndex (vimshottari order). */
export const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn',
  'Mercury', 'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter',
  'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury',
] as const

/** Nakshatra names in order from 0=Ashwini. */
export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
  'Uttara Phalguni', 'Hasta', 'Chitra', 'Svati', 'Vishaka',
  'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha',
  'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
] as const

/** Pada (quarter) of a nakshatra, 1-indexed (1..4). */
export type Pada = 1 | 2 | 3 | 4

/** Sidereal longitude of a body, decomposed into rasi/nakshatra. */
export interface SiderealPosition {
  /** Body name. */
  body: VedicBody
  /** Absolute sidereal ecliptic longitude in degrees [0, 360). */
  longitudeDeg: number
  /** Degrees within the rasi, 0..30. */
  degInRasi: number
  /** Rasi (sign) index 0..11. */
  rasiIndex: RasiIndex
  /** Rasi name (e.g. "Tula"). */
  rasiName: string
  /** Lord of the rasi. */
  rasiLord: string
  /** Nakshatra index 0..26 (undefined for the ascendant; prokerala
   *  reports nakshatra for planets but not the lagna in the rasi table). */
  nakshatraIndex?: NakshatraIndex
  /** Nakshatra name. */
  nakshatraName?: string
  /** Lord of the nakshatra (vimshottari dasha lord). */
  nakshatraLord?: string
  /** Pada (quarter) 1..4. */
  pada?: Pada
  /** Retrograde flag (Mercury, Venus, Mars, Jupiter, Saturn, Rahu, Ketu). */
  retrograde?: boolean
}

/** One vimshottari maha-dasha period. */
export interface DashaPeriod {
  /** Dasha lord (one of the 9 vimshottari lords). */
  lord: string
  /** Period start, ISO date (yyyy-mm-dd). */
  startISO: string
  /** Period end, ISO date (yyyy-mm-dd). */
  endISO: string
  /** Duration in years (7/20/6/10/7/18/16/19/17). */
  durationYears: number
}

/** A transit planet overlaying the natal chart on a target date. */
export interface TransitPlanet {
  /** Transit body. */
  body: VedicBody
  /** Transit sidereal longitude [0, 360). */
  longitudeDeg: number
  /** Rasi the transit body occupies. */
  rasiIndex: RasiIndex
  /** Rasi name. */
  rasiName: string
  /** Retrograde flag. */
  retrograde: boolean
}

/** Transit overlay for a target date. */
export interface TransitOverlay {
  /** Target date ISO (yyyy-mm-dd). */
  targetDateISO: string
  /** Transit planets (Sun..Saturn; Rahu/Ketu omitted for simplicity). */
  planets: TransitPlanet[]
}

/** Sidereal solar return (yearly equivalent) for a target year. */
export interface SolarReturn {
  /** Target year. */
  year: number
  /** Julian Day (UT) when the return Sun crosses natal sidereal Sun. */
  jdReturn: number
  /** Return date ISO (yyyy-mm-dd). */
  returnDateISO: string
  /** Sidereal longitudes of all planets at the return instant. */
  positions: SiderealPosition[]
}

/** The complete Vedic chart for a birth. */
export interface VedicChart {
  /** Birth date ISO. */
  birthDateISO: string
  /** Birth time ISO (HH:mm or HH:mm:ss). */
  birthTimeISO: string
  /** IANA timezone. */
  tzIANA: string
  /** Latitude. */
  lat: number
  /** Longitude. */
  lng: number
  /** Lahiri ayanamsa in degrees at birth. */
  ayanamsaDeg: number
  /** UT Julian Day of birth. */
  jdUT: number
  /** Lagna (ascendant) position. */
  lagna: SiderealPosition
  /** Moon position (with nakshatra/pada for dasha). */
  moon: SiderealPosition
  /** All planet positions (Sun..Ketu, no ascendant). */
  planets: SiderealPosition[]
  /** Vimshottari maha-dasha sequence (9 periods, starting from moon
   *  nakshatra lord, wrapping the vimshottari cycle). */
  dasha: DashaPeriod[]
}
