// src/engines/bazi.ts — BaZi (八字) engine barrel.
//
// Re-exports the public surface of the BaZi engine. Implementations live
// in sibling modules under ./bazi/ (types, four-pillars, strength,
// luck-pillars, ten-gods). Mirrors the src/core/birth.ts barrel pattern.
//
// All public functions are pure and deterministic: same BirthData +
// gender -> same output, because lunar-javascript itself is deterministic
// given an explicit wall-clock {y,m,d,h,mi,s} tuple.

export type {
  Pillar,
  FourPillars,
  Strength,
  StrengthVerdict,
  LuckPillar,
  TenGods,
  PillarTenGods,
  Gender,
  ResolvedTime,
} from './bazi/types'
export { computeFourPillars, resolveWallClock } from './bazi/four-pillars'
export { computeStrength } from './bazi/strength'
export { computeLuckPillars } from './bazi/luck-pillars'
export { computeTenGods } from './bazi/ten-gods'
