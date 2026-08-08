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
//
// Five-element math lives in ./dashboard-elements.ts and Indonesian date
// helpers in ./dashboard-dates.ts (mechanical split — todo 1 F2 debt).

import type { BirthData } from '../core/birth'
import {
  computeDailyForecast,
  computeMonthlyForecast,
  computeWeeklyForecast,
  computeYearlyForecast,
} from '../engines/bazi'
import type { ForecastHorizon } from '../engines/bazi/types'
import { buildTlDr } from '../synthesis/narrative'
import type { Horizon } from '../synthesis/narrative'
import type { DomainScore, EngineDetail } from '../synthesis/scorer'
import {
  natalTally,
  genderOf,
  scoreFor,
  tallyOf,
  type Tally,
} from './dashboard-elements'
import {
  isoOfDate,
  addDaysISO,
  formatDateLabel,
  relativeLabelFor,
} from './dashboard-dates'

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