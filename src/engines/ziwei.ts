// src/engines/ziwei.ts — Zi Wei Dou Shu (紫微斗数) engine barrel.
//
// Re-exports the public surface of the Zi Wei engine. Implementations
// live in sibling modules under ./ziwei/ (types, bureau, stars, chart).
// Mirrors the src/engines/bazi.ts barrel pattern.
//
// All public functions are pure and deterministic: same BirthData +
// gender -> same output, because lunar-javascript itself is deterministic
// given an explicit wall-clock {y,m,d,h,mi,s} tuple.

export type {
  StarType,
  SiHuaFlag,
  PalaceStar,
  Palace,
  NaYinBureau,
  SiHua,
  ZiWeiChart,
  Gender,
  ZiWeiForecastKind,
  PalaceFocus,
  ZiWeiForecastHorizon,
} from './ziwei/types'
export {
  computeMingShenGong,
  computeBureau,
  buildPalaceLayout,
  fixIndex,
} from './ziwei/bureau'
export {
  getZiweiTianfuIndex,
  placePrimaryStars,
  placeAuxStars,
  computeSiHua,
  PRIMARY_STARS,
} from './ziwei/stars'
export { computeZiWeiChart } from './ziwei/chart'
export {
  computeYearlyForecast,
  computeMonthlyForecast,
  computeDailyForecast,
  computeDecadeForecast,
} from './ziwei/forecast'
