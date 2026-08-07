// src/engines/ziwei/types.ts — shared types for the Zi Wei Dou Shu engine.
//
// The engine computes the 12-palace layout (命/身宫), 14 primary stars
// (紫微系 + 天府系), auxiliary stars, and 四化 (禄权科忌) from a BirthData
// value. All public functions are pure: same BirthData + gender -> same
// output, because lunar-javascript is deterministic given an explicit
// wall-clock {y,m,d,h,mi,s} tuple.
//
// The chart shape mirrors the golden fixtures in tests/golden/ziwei/.

/** Star type as recorded in the fixtures. */
export type StarType = 'main' | 'aux'

/** 四化 flag on a star: 禄 (prosperity), 权 (power), 科 (fame), 忌 (taboo). */
export type SiHuaFlag = '禄' | '权' | '科' | '忌'

/** A star placed in a palace, optionally carrying a 四化 flag. */
export interface PalaceStar {
  /** Star name in Chinese, e.g. "紫微", "左辅". */
  name: string
  /** 'main' for the 14 primary stars, 'aux' for auxiliary stars. */
  type: StarType
  /** 四化 flag if the star carries one for this year stem, else omitted. */
  siHua?: SiHuaFlag
}

/** One of the 12 palaces, indexed by earthly branch (子=0 .. 亥=11). */
export interface Palace {
  /** Branch index 0-11 (子=0, 丑=1, ..., 亥=11). */
  branchIndex: number
  /** Branch character, e.g. "子", "亥". */
  branch: string
  /** Full gan-zhi of this palace, e.g. "戊子". */
  ganZhi: string
  /** Palace name, e.g. "命宫", "父母". */
  name: string
  /** Age range for the 大限 (decade) starting at this palace. */
  ageRange: string
  /** Stars placed in this palace. */
  stars: PalaceStar[]
  /** True if this palace is the 命宫 (Life Palace). */
  isMingGong: boolean
  /** True if this palace is the 身宫 (Body Palace). */
  isShenGong: boolean
}

/** NaYin 五行局 (Five Elements Bureau) derived from the 命宫 gan-zhi. */
export interface NaYinBureau {
  /** Element: 水/木/金/土/火. */
  element: string
  /** Bureau number: 2 (water), 3 (wood), 4 (metal), 5 (earth), 6 (fire). */
  number: number
  /** Full name, e.g. "土五局", "水二局". */
  name: string
}

/** The 四化 mapping: which star carries each flag for the year stem. */
export interface SiHua {
  /** Star carrying 禄 (prosperity). */
  禄: string
  /** Star carrying 权 (power). */
  权: string
  /** Star carrying 科 (fame). */
  科: string
  /** Star carrying 忌 (taboo). */
  忌: string
}

/** The complete Zi Wei Dou Shu chart. */
export interface ZiWeiChart {
  /** Solar date string, e.g. "1990-05-10". */
  solarDate: string
  /** Lunar date in Chinese, e.g. "一九九〇年四月十六". */
  lunarDate: string
  /** Lunar month number (1-12). */
  lunarMonth: number
  /** Lunar day number (1-30). */
  lunarDay: number
  /** Year pillar gan-zhi, e.g. "庚午". */
  yearGanZhi: string
  /** Month pillar gan-zhi, e.g. "辛巳". */
  monthGanZhi: string
  /** Day pillar gan-zhi, e.g. "乙亥". */
  dayGanZhi: string
  /** Time pillar gan-zhi, e.g. "壬午". */
  timeGanZhi: string
  /** Time branch index (0-11, 子=0). */
  timeBranchIndex: number
  /** True if the birth hour is 23:00-24:00 (晚子时). */
  isLateZi: boolean
  /** NaYin 五行局 from the 命宫. */
  naYinBureau: NaYinBureau
  /** Branch index of the 命宫 (0-11). */
  mingGongBranchIndex: number
  /** Branch index of the 身宫 (0-11). */
  shenGongBranchIndex: number
  /** The 12 palaces, indexed by branch (子=0 .. 亥=11). */
  palaces: Palace[]
  /** The 四化 mapping for the year stem. */
  siHua: SiHua
}

/** Gender: 1 = male (阳), 0 = female (阴) — matches lunar-javascript. */
export type Gender = 1 | 0

/** One of the four forecast horizons. */
export type ZiWeiForecastKind = 'year' | 'month' | 'day' | 'decade'

/** A palace highlighted as a focus for a forecast horizon. */
export interface PalaceFocus {
  /** Branch index 0-11 of the focused palace. */
  branchIndex: number
  /** Palace name, e.g. "命宫", "财帛". */
  name: string
  /** Energy score: Σ main-star weights (紫微/天府/七杀/破军=3, others=1). */
  score: number
}

/** A Zi Wei forecast horizon (流年/流月/流日/大限). */
export interface ZiWeiForecastHorizon {
  /** Which horizon this is. */
  kind: ZiWeiForecastKind
  /** ISO date the forecast targets (Gregorian, UTC). */
  dateISO: string
  /** Branch index of the active palace for this horizon. */
  activePalaceIndex: number
  /** Name of the active palace (流年命宫 / 大限宫 etc.). */
  activePalaceName: string
  /** Top-2 palaces by energy score. Exactly 2 entries. */
  palaceFocus: PalaceFocus[]
}
