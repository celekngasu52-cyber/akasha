// src/engines/vedic.ts — Vedic (sidereal) engine barrel.
//
// Re-exports the public surface of the Vedic engine. Implementations live
// in sibling modules under ./vedic/ (types, sidereal, chart). Mirrors the
// src/engines/bazi.ts barrel pattern.
//
// All public functions are pure and deterministic: same BirthData -> same
// output, because swisseph-wasm is deterministic given a UT Julian Day.

export type {
  VedicBody,
  RasiIndex,
  NakshatraIndex,
  Pada,
  SiderealPosition,
  DashaPeriod,
  TransitPlanet,
  TransitOverlay,
  SolarReturn,
  VedicChart,
} from './vedic/types'
export {
  RASI_NAMES,
  RASI_LORDS,
  NAKSHATRA_LORDS,
  NAKSHATRA_NAMES,
} from './vedic/types'
export {
  DASHA_SEQUENCE,
  DASHA_YEARS,
  DASHA_TOTAL_YEARS,
  jdUTFromBirth,
  siderealAscendant,
  siderealPlanets,
  toSiderealPosition,
  findPlanet,
} from './vedic/sidereal'
export { computeVimshottari, computeVedicChart } from './vedic/chart'
