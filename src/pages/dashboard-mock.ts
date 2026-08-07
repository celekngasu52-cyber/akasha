// src/pages/dashboard-mock.ts — deterministic mock dashboard data.
//
// PLACEHOLDER until todo 17 (result page) + todo 19 (synthesis wiring) connect
// the real Chart4 -> scorer -> narrative pipeline to the UI. The shapes here
// mirror src/synthesis/scorer.ts (DomainScore, EngineDetail) and
// src/synthesis/narrative.ts (buildTlDr/NarrativeInput) so the swap is a single
// import change, not a retype.
//
// Determinism: every value is seeded by (horizon, domain). No Math.random, no
// Date.now — same input always yields the same dashboard. This is required for
// screenshot QA and for the agreement assertion (todo 16 AC).
//
// Domain vocabulary is fixed across the codebase (see mappings.ts / narrative.ts):
// Karier, Cinta, Kesehatan, Keuangan.
// Engines (ENGINES order from mappings.ts): BaZi, ZiWei, Vedic, Western.

import type { Horizon } from '../synthesis/narrative'
import { buildTlDr } from '../synthesis/narrative'
import type { DomainScore, EngineDetail } from '../synthesis/scorer'

/** Domains shown on the dashboard, in display order. */
export const DASHBOARD_DOMAINS = [
  'Karier',
  'Cinta',
  'Kesehatan',
  'Keuangan',
] as const

export type DashboardDomain = (typeof DASHBOARD_DOMAINS)[number]

/** Engine labels for the WhyPanel, in scorer ENGINES order. */
export const ENGINE_LABELS = ['BaZi', 'ZiWei', 'Vedic', 'Western'] as const

/** 30-day trend points per domain (deterministic, seeded). */
export type Trend30 = readonly number[]

/** A dashboard domain entry: scorer DomainScore + trend + tlDr. */
export interface DashboardDomainEntry {
  readonly domain: DashboardDomain
  readonly score: DomainScore
  readonly trend: Trend30
  readonly tlDr: string
}

/** Full dashboard state for one horizon tab. */
export interface DashboardHorizonData {
  readonly horizon: Horizon
  /** Per-domain entries in DASHBOARD_DOMAINS order. */
  readonly domains: readonly DashboardDomainEntry[]
  /** Horizon-level tlDr built via narrative.buildTlDr. */
  readonly horizonTlDr: string
}

/* ---- deterministic seed helpers (xorshift32, no deps) ---- */

function hashSeed(str: string): number {
  // FNV-1a 32-bit — stable across runs, no BigInt needed.
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    // Math.imul keeps it 32-bit; >> 0 forces unsigned.
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function rand(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Map a 0..1 float to a 0..100 integer, clamped. */
function toScore100(r: number): number {
  return Math.max(0, Math.min(100, Math.round(r * 100)))
}

/** Label thresholds mirror scorer.ts: >=70 Tinggi, 40-69 Sedang, <40 Rendah. */
function labelFor(score: number): 'Tinggi' | 'Sedang' | 'Rendah' {
  if (score >= 70) return 'Tinggi'
  if (score >= 40) return 'Sedang'
  return 'Rendah'
}

/** Engine vote signal: -1, 0, +1 — mirrors Vote type in mappings.ts. */
type Vote = -1 | 0 | 1

const ALASAN_TEMPLATES: Readonly<Record<Vote, string>> = Object.freeze({
  [-1]: 'Aspek menekan domain ini, waspadai hambatan.',
  [0]: 'Tidak ada sinyal kuat — netral untuk domain ini.',
  [1]: 'Aspek mendukung domain ini, manfaatkan momentum.',
})

/** Build a deterministic trend of 30 values in [0,100] anchored to a base. */
function buildTrend(seed: number, base: number): number[] {
  const rand = mulberry32(seed)
  const out: number[] = []
  for (let i = 0; i < 30; i++) {
    // Drift around base +/- 18, deterministic walk.
    const drift = (rand() - 0.5) * 36
    const v = base + drift + (i / 30) * 6 // gentle upward bias
    out.push(Math.max(0, Math.min(100, Math.round(v))))
  }
  return out
}

/** Build 4 engine details for a domain, seeded. */
function buildDetails(
  seed: number,
  domain: DashboardDomain,
): readonly EngineDetail[] {
  const rand = mulberry32(seed)
  const votes: Vote[] = [-1, 0, 1]
  return ENGINE_LABELS.map((engine) => {
    const r = rand()
    const vote: Vote = votes[Math.floor(r * 3) % 3]!
    // Weight in [0.3, 1.0]; never zero so the panel always has signal.
    const weight = Math.round((0.3 + rand() * 0.7) * 100) / 100
    return {
      engine,
      domain,
      vote,
      weight,
      alasanSingkat: ALASAN_TEMPLATES[vote],
    } satisfies EngineDetail
  })
}

/** Build one domain's full entry, seeded by horizon+domain. */
function buildDomainEntry(
  horizon: Horizon,
  domain: DashboardDomain,
): DashboardDomainEntry {
  const seedStr = `${horizon}|${domain}`
  const seed = hashSeed(seedStr)
  const rand = mulberry32(seed)
  const agreement = toScore100(rand())
  const details = buildDetails(seed + 7, domain)
  const score: DomainScore = {
    domain,
    details,
    agreement,
    label: labelFor(agreement),
  }
  const trend = buildTrend(seed + 13, agreement)
  return { domain, score, trend, tlDr: '' }
}

/**
 * Build the full dashboard data for all 4 horizons. Pure + deterministic.
 * Each horizon gets 4 domain entries + a horizon tlDr via narrative.buildTlDr.
 */
export function buildDashboardData(): readonly DashboardHorizonData[] {
  const horizons: Horizon[] = ['harian', 'mingguan', 'bulanan', 'tahunan']
  return horizons.map((horizon) => {
    const domains = DASHBOARD_DOMAINS.map((d) => buildDomainEntry(horizon, d))
    // Pick top/bottom by agreement for the horizon-level tlDr.
    const sorted = [...domains].sort((a, b) => b.score.agreement - a.score.agreement)
    const top = sorted[0]!
    const bottom = sorted[sorted.length - 1]!
    // Agreement label = mean-based tier, matching narrative.ts intent.
    const meanScore =
      domains.reduce((s, d) => s + d.score.agreement, 0) / domains.length
    const horizonTlDr = buildTlDr({
      horizon,
      agreementLabel: labelFor(Math.round(meanScore)),
      topDomain: { name: top.domain, score: top.score.agreement },
      bottomDomain: { name: bottom.domain, score: bottom.score.agreement },
    })
    return { horizon, domains, horizonTlDr }
  })
}
