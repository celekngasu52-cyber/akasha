// src/pages/dashboard-data.ts — real, deterministic dashboard data.
//
// Replaces the old FNV-random dashboard-mock. Every value is derived from the
// real (synchronous) BaZi engine for a specific birth. Two signals are blended:
//   - a natal baseline from the birth chart's own five-element tally
//     (computeFourPillars), so results are personal to THIS chart;
//   - a per-horizon / per-day signal from the target date's elementScores
//     (computeDailyForecast / Weekly / Monthly / Yearly).
//
// No Math.random, no Date.now. The only nondeterminism is the "today" anchor
// (new Date) captured once per call, so same birth + same window always yields
// the same dashboard.
//
// The full 4-engine agreement scorer (Chart4 = bazi+ziwei+vedic+western) is
// intentionally not wired here: computeVedicChart and computeNatalChart are
// async (Swiss Ephemeris Wasm), so a synchronous Chart4 is impossible. This
// module is the synchronous, real BaZi core; the async cross-engine scorer is
// a separate iteration.
//
// Domain → element affinity (a fixed design choice, documented):
//   Karier -> fire, Cinta -> water, Kesehatan -> wood, Keuangan -> earth.

import type { BirthData } from '../core/birth'
import {
  computeDailyForecast,
  computeFourPillars,
  computeMonthlyForecast,
  computeWeeklyForecast,
  computeYearlyForecast,
} from '../engines/bazi'
import type { ElementScores, ForecastHorizon } from '../engines/bazi/types'
import { buildTlDr } from '../synthesis/narrative'
import type { Horizon } from '../synthesis/narrative'
import type { DomainScore, EngineDetail } from '../synthesis/scorer'

/** Domains shown on the dashboard, in display order. */
export const DASHBOARD_DOMAINS = [
  'Karier',
  'Cinta',
  'Kesehatan',
  'Keuangan',
] as const

export type DashboardDomain = (typeof DASHBOARD_DOMAINS)[number]

/** Engine labels for the WhyPanel, in scorer order. */
export const ENGINE_LABELS = ['BaZi', 'ZiWei', 'Vedic', 'Western'] as const

/** 30-day trend points per domain. */
export type Trend30 = readonly number[]

/** A dashboard domain entry: score + trend + tlDr. */
export interface DashboardDomainEntry {
  readonly domain: DashboardDomain
  readonly score: DomainScore
  readonly trend: Trend30
  readonly tlDr: string
}

/** Full dashboard state for one horizon tab. */
export interface DashboardHorizonData {
  readonly horizon: Horizon
  readonly domains: readonly DashboardDomainEntry[]
  readonly horizonTlDr: string
}

/** One day in the harian forecast list. */
export interface DailyEntry {
  readonly dateISO: string
  readonly relativeLabel: string
  readonly dateLabel: string
  readonly agreementLabel: 'Tinggi' | 'Sedang' | 'Rendah'
  readonly domains: readonly { domain: DashboardDomain; score: number }[]
  readonly tlDr: string
}

/** Number of days shown in the daily forecast list. */
export const DAILY_HORIZON_DAYS = 7

/* ---- five-element helpers ---- */

const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const
type Element = (typeof ELEMENTS)[number]

/** Domain → the element whose live share drives that domain's swing. */
const DOMAIN_ELEMENT: Readonly<Record<DashboardDomain, Element>> = {
  Karier: 'fire',
  Cinta: 'water',
  Kesehatan: 'wood',
  Keuangan: 'earth',
}

/** Five-element tally type. */
type Tally = Record<Element, number>

/** Sum of a five-element tally. */
function sumScores(s: Tally): number {
  return ELEMENTS.reduce((acc, e) => acc + Math.max(0, s[e]), 0)
}

/** Element share (fraction 0..1). */
function elShare(s: Tally, el: Element): number {
  const tot = sumScores(s)
  return tot === 0 ? 0.2 : Math.max(0, s[el]) / tot
}

/** Map a 0..1 share to a 0..100 score so a typical share (≈0.2) lands mid. */
function shareToScore(share: number): number {
  return Math.max(0, Math.min(100, Math.round(40 + share * 65)))
}

/** Clamp helper. */
function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** Blend natal personality (0.6) with the live horizon signal (0.4). */
function blend(natal: number, live: number): number {
  return clamp100(natal * 0.6 + live * 0.4)
}

/** Per-domain score: natal baseline + live element signal from a horizon. */
function scoreFor(natal: Tally, hzElement: Tally | undefined, domain: DashboardDomain): number {
  const el = DOMAIN_ELEMENT[domain]
  const base = shareToScore(elShare(natal, el))
  const live = hzElement ? shareToScore(elShare(hzElement, el)) : base
  return blend(base, live)
}

type Gender = 0 | 1

/** Resolved engine gender: female → 0, everything else → 1 (documented default). */
function genderOf(birth: BirthData): Gender {
  return birth.gender === 'female' ? 0 : 1
}

/** Natal five-element tally from the birth's four pillars (stems weigh 2, branches 1). */
function natalTally(birth: BirthData): Tally {
  const pillars = computeFourPillars(birth)
  const tally: Tally = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  const STEM_EL: Record<string, Element> = {
    甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
    己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
  }
  const BRANCH_EL: Record<string, Element> = {
    子: 'water', 丑: 'earth', 寅: 'wood', 卯: 'wood', 辰: 'earth', 巳: 'fire',
    午: 'fire', 未: 'earth', 申: 'metal', 酉: 'metal', 戌: 'earth', 亥: 'water',
  }
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    tally[STEM_EL[p.stem] ?? 'earth'] += 2
    tally[BRANCH_EL[p.branch] ?? 'earth'] += 1
  }
  return tally
}

/** Tally from an elementScores record (ForecastHorizon.elementScores). */
function tallyOf(el: ElementScores): Tally {
  return { wood: el.wood, fire: el.fire, earth: el.earth, metal: el.metal, water: el.water }
}

/** All four per-domain scores in a given element tally. */
function domainScores(natal: Tally, anchor: ForecastHorizon | undefined): number[] {
  const tib = anchor ? tallyOf(anchor.elementScores) : undefined
  return DASHBOARD_DOMAINS.map((dom) => scoreFor(natal, tib, dom))
}

/** Agreement label thresholds mirror scorer.ts: >=70 Tinggi, 40-69 Sedang, <40 Rendah. */
function labelFor(score: number): 'Tinggi' | 'Sedang' | 'Rendah' {
  if (score >= 70) return 'Tinggi'
  if (score >= 40) return 'Sedang'
  return 'Rendah'
}

/** Mean-based agreement tier across the four domain scores. */
function meanLabel(scores: readonly number[]): 'Tinggi' | 'Sedang' | 'Rendah' {
  const mean = scores.reduce((s, n) => s + n, 0) / scores.length
  return labelFor(Math.round(mean))
}

/** Sorted domain/score list, used for top/bottom in the narrative. */
function sortedDomains(scores: readonly number[]) {
  return scores
    .map((score, idx) => ({ name: DASHBOARD_DOMAINS[idx]!, score }))
    .sort((a, b) => b.score - a.score)
}

/* ---- WhyPanel details (synthesized from the final score) ---- */

function buildDetails(domain: DashboardDomain, score: number): readonly EngineDetail[] {
  const vote = score >= 70 ? 1 : score >= 40 ? 0 : -1
  const alasanSingkat =
    vote === 1
      ? 'Elemen pendukung dominan pada periode ini.'
      : vote === 0
        ? 'Sinyal netral, belum ada momentum kuat.'
        : 'Elemen penekan cukup menonjol, waspadai hambatan.'
  return ENGINE_LABELS.map((engine) => ({ engine, domain, vote, weight: 0.6, alasanSingkat }))
}

/* ---- Indonesian date helpers (no locale API, deterministic) ---- */

const DAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const

const pad2 = (n: number): string => String(n).padStart(2, '0')

function isoOfDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d! + n))
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
}

function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${DAYS_SHORT[weekdayIndex(iso)]}, ${d} ${MONTHS_SHORT[m! - 1]} ${y}`
}

function relativeLabelFor(dayIndex: number, iso: string): string {
  if (dayIndex === 0) return 'Hari ini'
  if (dayIndex === 1) return 'Besok'
  if (dayIndex === 2) return 'Lusa'
  return DAYS_LONG[weekdayIndex(iso)]!
}

/* ---- public builders ---- */

/** Build the per-horizon dashboard data (harian/mingguan/bulanan/tahunan). */
export function buildDashboardData(birthData: BirthData): readonly DashboardHorizonData[] {
  const natal = natalTally(birthData)
  const now = new Date()
  const startISO = isoOfDate(now)
  const g = genderOf(birthData)

  const anchors: readonly { horizon: Horizon; anchor: ForecastHorizon }[] = [
    { horizon: 'harian', anchor: computeDailyForecast(birthData, g, startISO) },
    { horizon: 'mingguan', anchor: computeWeeklyForecast(birthData, g, startISO) },
    {
      horizon: 'bulanan',
      anchor: computeMonthlyForecast(birthData, g, now.getFullYear(), now.getMonth() + 1),
    },
    { horizon: 'tahunan', anchor: computeYearlyForecast(birthData, g, now.getFullYear()) },
  ]

  return anchors.map(({ horizon, anchor }) => {
    const scores = domainScores(natal, anchor)
    const trendStart = addDaysISO(startISO, -14)
    const domains: DashboardDomainEntry[] = DASHBOARD_DOMAINS.map((dom, idx) => ({
      domain: dom,
      score: {
        domain: dom,
        details: buildDetails(dom, scores[idx]!),
        agreement: scores[idx]!,
        label: labelFor(scores[idx]!),
      },
      trend: trendFor(birthData, natal, dom, trendStart),
      tlDr: `Skor ${scores[idx]!}/100, ${labelFor(scores[idx]!)}.`,
    }))
    const sorted = sortedDomains(scores)
    return {
      horizon,
      domains,
      horizonTlDr: buildTlDr({
        horizon,
        agreementLabel: meanLabel(scores),
        topDomain: { name: sorted[0]!.name, score: sorted[0]!.score },
        bottomDomain: { name: sorted[3]!.name, score: sorted[3]!.score },
      }),
    }
  })
}

/** Build the 7-day harian forecast list anchored at today. */
export function buildDailyForecast(birthData: BirthData): readonly DailyEntry[] {
  const startISO = isoOfDate(new Date())
  const natal = natalTally(birthData)
  const g = genderOf(birthData)
  const out: DailyEntry[] = []
  for (let i = 0; i < DAILY_HORIZON_DAYS; i++) {
    const iso = addDaysISO(startISO, i)
    const hz = computeDailyForecast(birthData, g, iso)
    const scores = domainScores(natal, hz)
    const sorted = sortedDomains(scores)
    out.push({
      dateISO: iso,
      relativeLabel: relativeLabelFor(i, iso),
      dateLabel: formatDateLabel(iso),
      agreementLabel: meanLabel(scores),
      domains: DASHBOARD_DOMAINS.map((dom, idx) => ({ domain: dom, score: scores[idx]! })),
      tlDr: buildTlDr({
        horizon: 'harian',
        agreementLabel: meanLabel(scores),
        topDomain: { name: sorted[0]!.name, score: sorted[0]!.score },
        bottomDomain: { name: sorted[3]!.name, score: sorted[3]!.score },
      }),
    })
  }
  return out
}

/** 30-day trend for a domain: real per-day score for 30 days from a start. */
function trendFor(
  birth: BirthData,
  natal: Tally,
  domain: DashboardDomain,
  start: string,
): number[] {
  const g = genderOf(birth)
  const out: number[] = []
  for (let i = 0; i < 30; i++) {
    const hz = computeDailyForecast(birth, g, addDaysISO(start, i))
    out.push(scoreFor(natal, tallyOf(hz.elementScores), domain))
  }
  return out
}