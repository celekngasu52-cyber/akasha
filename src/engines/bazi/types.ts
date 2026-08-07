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

// ---------------------------------------------------------------------------
// Forecast (流年/流月/流日) types.
// ---------------------------------------------------------------------------

/**
 * One of the three target-date pillars a forecast exposes: 年 (year),
 * 月 (month), 日 (day). The hour pillar is omitted because a forecast
 * targets a calendar day, not a birth hour.
 */
export interface ForecastPillar {
  /** Pillar slot: 'year' | 'month' | 'day'. */
  slot: 'year' | 'month' | 'day'
  /** Full gan-zhi string, e.g. "丙午". */
  ganZhi: string
  /** Heavenly stem (one character). */
  stem: string
  /** Earthly branch (one character). */
  branch: string
}

/** Five-element scores for a set of forecast pillars. */
export interface ElementScores {
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
}

/**
 * Standard gan-zhi interactions detected among the forecast pillars and the
 * birth day master. Each list holds the two-character gan-zhi strings of the
 * pillars involved in that interaction kind.
 */
export interface ForecastInteractions {
  /** Branch clashes (地支六冲): 子午, 丑未, 寅申, 卯酉, 辰戌, 巳亥. */
  clashes: string[]
  /** Branch combinations (地支六合): 子丑, 寅亥, 卯戌, 辰酉, 巳申, 午未. */
  combines: string[]
  /** Branch controls (五行相克): wood克earth, earth克water, etc. */
  controls: string[]
  /** Stem combinations (天干五合): 甲己, 乙庚, 丙辛, 丁壬, 戊癸. */
  stemCombines: string[]
}

/** The active 大運 for a target year (may be empty for the pre-大運 period). */
export interface ActiveLuck {
  /** Gan-zhi of the active 大運; empty string for the pre-大運 period. */
  ganZhi: string
  /** Start year of the decade. */
  startYear: number
  /** End year of the decade. */
  endYear: number
}

/**
 * One forecast horizon. `daily` exposes the target day pillar; `weekly`
 * exposes seven daily horizons; `monthly` exposes the target month pillar
 * plus active luck; `yearly` exposes the target year pillar plus active
 * luck. Every horizon reports the five-element scores and the standard
 * clash/combine/control interactions among its pillars and the birth day
 * master.
 */
export interface ForecastHorizon {
  /** Which horizon: 'daily' | 'weekly' | 'monthly' | 'yearly'. */
  kind: 'daily' | 'weekly' | 'monthly' | 'yearly'
  /** ISO calendar date the forecast is anchored on (target day for daily). */
  targetISO: string
  /** The three target-date pillars (year/month/day) for this horizon. */
  pillars: ForecastPillar[]
  /** Five-element scores across the target pillars (stems weight 2, branches 1). */
  elementScores: ElementScores
  /** Standard gan-zhi interactions among target pillars + birth day master. */
  interactions: ForecastInteractions
  /** Active 大運 covering the target year (omitted for daily/weekly). */
  activeLuck?: ActiveLuck
  /** For weekly: the seven daily horizons. Omitted for non-weekly kinds. */
  days?: ForecastHorizon[]
}
