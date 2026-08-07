// src/engines/western.ts — Western (tropical) engine barrel.
//
// Re-exports the public surface of the Western engine. Implementations live
// in sibling modules under ./western/ (types, chart, aspects). Mirrors the
// src/engines/bazi.ts barrel pattern.
//
// All public functions are pure and deterministic: same BirthData -> same
// output, because swisseph-wasm is deterministic given a UT Julian Day.

export type {
  WesternBody,
  AngleName,
  WesternPosition,
  HouseSystem,
  HouseCusp,
  AspectType,
  Aspect,
  WesternChart,
  TransitEntry,
  SolarReturn,
} from './western/types'
export {
  PLANET_BODIES,
  jdUTFromBirth,
  computeNatalChart,
  computeTransits,
  computeSolarReturn,
} from './western/chart'
export { computeAspects, angularSeparation } from './western/aspects'
