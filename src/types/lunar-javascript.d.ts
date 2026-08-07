// src/types/lunar-javascript.d.ts — ambient type shim for lunar-javascript.
//
// The `lunar-javascript` package ships no bundled types and there is no
// `@types/lunar-javascript` on npm (see issues.md). This shim declares the
// minimal public surface this engine consumes: Solar.fromDate -> Lunar ->
// EightChar (four pillars, ten gods, da yun) and I18n.setLanguage.
//
// Keep it narrow: extend only when a new call site needs an untyped method.

declare module 'lunar-javascript' {
  /** Gregorian solar date. */
  export class Solar {
    static fromYmd(y: number, m: number, d: number): Solar
    static fromYmdHms(
      y: number,
      m: number,
      d: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar
    static fromDate(date: Date): Solar
    getLunar(): Lunar
    getYear(): number
    getMonth(): number
    getDay(): number
    getHour(): number
  }

  /** Chinese lunar date, the gateway to gan-zhi / eight-char computations. */
  export class Lunar {
    static fromDate(date: Date): Lunar
    static fromYmd(y: number, m: number, d: number): Lunar
    getEightChar(): EightChar
    getMonth(): number
    getDay(): number
    toString(): string
    getYearInGanZhiExact(): string
    getYearGan(): string
    getYearZhi(): string
    getMonthGan(): string
    getMonthZhi(): string
    getDayGan(): string
    getDayZhi(): string
    getSolar(): Solar
  }

  /** 八字 — four pillars (year/month/day/hour) and derived values. */
  export class EightChar {
    /** Full pillar strings, e.g. "庚午". */
    getYear(): string
    getMonth(): string
    getDay(): string
    getTime(): string
    /** Single heavenly stem, e.g. "辛" (day stem is the day master). */
    getYearGan(): string
    getMonthGan(): string
    getDayGan(): string
    getTimeGan(): string
    /** Single earthly branch, e.g. "午". */
    getYearZhi(): string
    getMonthZhi(): string
    getDayZhi(): string
    getTimeZhi(): string
    /** Ten god of each stem relative to the day master (日主 returns "日主"). */
    getYearShiShenGan(): string
    getMonthShiShenGan(): string
    getDayShiShenGan(): string
    getTimeShiShenGan(): string
    /** Ten gods of each hidden stem within a branch. */
    getYearShiShenZhi(): string[]
    getMonthShiShenZhi(): string[]
    getDayShiShenZhi(): string[]
    getTimeShiShenZhi(): string[]
    /** 大運 root: gender 1=male, 0=female; sect 1=naiping, 2=real-solar. */
    getYun(gender: number, sect?: number): Yun
    getLunar(): Lunar
  }

  /** 大運 root; the first DaYun entry is the pre-大運 period. */
  export class Yun {
    getStartYear(): number
    getStartMonth(): number
    getStartDay(): number
    getStartHour(): number
    isForward(): boolean
    getDaYun(n: number): DaYun[]
  }

  /** One 大運 decade pillar. Index 0 is the pre-大運 period (empty GanZhi). */
  export class DaYun {
    getStartAge(): number
    getStartYear(): number
    getEndAge(): number
    getEndYear(): number
    getGanZhi(): string
    getLunar(): Lunar
  }

  /** Language switch; 'zh' resolves gan-zhi / shishen to Chinese characters. */
  export const I18n: {
    setLanguage(lang: 'zh' | 'en'): void
    getMessage(key: string): string
  }
}
