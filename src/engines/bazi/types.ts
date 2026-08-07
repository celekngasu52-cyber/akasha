// src/engines/bazi/types.ts — shared types for the BaZi (八字) engine.
//
// The engine wraps `lunar-javascript` EightChar for the four pillars, then
// derives day-master strength (旺衰), luck pillars (大運), and ten gods
// (十神). All public functions are pure: same BirthData + gender -> same
// output, because lunar-javascript itself is deterministic.

/** One of the four pillars: 年 / 月 / 日 / 時. */
export interface Pillar {
  /** Full gan-zhi string, e.g. "庚午" (two Chinese characters). */
  ganZhi: string
  /** Heavenly stem (天干), one character, e.g. "庚". */
  stem: string
  /** Earthly branch (地支), one character, e.g. "午". */
  branch: string
}

/** The four pillars of a BaZi chart. */
export interface FourPillars {
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar
}

/** Day-master strength verdict, computed from a weighted element tally. */
export type StrengthVerdict = 'strong' | 'balanced' | 'weak'

/** Result of the strength (旺衰) computation. */
export interface Strength {
  /**
   * Signed score: +1 per supporting/same-element contribution, -1 per
   * draining/controlling contribution. Stems weigh 2, branches weigh 1.
   * Verdict: strong >= +2, weak <= -2, balanced otherwise.
   */
  score: number
  verdict: StrengthVerdict
}

/** One 大運 decade pillar. */
export interface LuckPillar {
  /** Pillar gan-zhi string; empty for the pre-大運 period (index 0). */
  ganZhi: string
  /** Starting age of the decade (1-based from birth year). */
  startAge: number
  /** Ending age of the decade. */
  endAge: number
  /** Starting Gregorian year. */
  startYear: number
  /** Ending Gregorian year. */
  endYear: number
}

/** Ten gods (十神) for one pillar slot. */
export interface PillarTenGods {
  /** Ten god of the pillar's heavenly stem (relative to the day master). */
  stem: string
  /** Ten gods of the pillar's branch hidden stems (one per hidden stem). */
  branches: string[]
}

/** Ten gods for all four pillars. */
export interface TenGods {
  year: PillarTenGods
  month: PillarTenGods
  day: PillarTenGods
  hour: PillarTenGods
}

/** Gender code passed to lunar-javascript: 1=male, 0=female. */
export type Gender = 0 | 1

/**
 * Resolve a BirthData time into {hour, minute, second} for lunar-javascript.
 * Returns 0,0,0 when the time is unknown so the chart still computes (the
 * hour pillar collapses to the first 子时 slot, which is the documented
 * boundary behaviour — see docs/bazi-school.md).
 */
export interface ResolvedTime {
  hour: number
  minute: number
  second: number
}
