// src/synthesis/scorer.ts — cross-engine domain agreement scorer.
//
// Pure, deterministic. Consumes a Chart4 (the four engine charts) and for each
// domain evaluates every (engine × domain) rule from mappings.ts, collecting
// each engine's {vote, weight, alasanSingkat}. The per-domain agreement score
// follows the explicit formula from the plan:
//
//   agreement = 100 × (1 − σ²(votes)) × mean(w)
//
// where σ² is the population variance over the engines whose vote ≠ 0
// (engines giving no signal are excluded from the variance term), and mean(w)
// is the mean weight across ALL engines (zero-signal engines still dilute
// the weight — their weight carries into mean(w) because a low-confidence
// abstention should lower overall agreement).
//
// Label thresholds (fixed):
//   ≥ 70  -> 'Tinggi'
//   40-69 -> 'Sedang'
//   < 40  -> 'Rendah'
//
// Synthetic verification (in comments, asserted in tests):
//   Case A — unanimous +1, all weights 1:
//     votes = [+1,+1,+1,+1], σ² = 0, mean(w) = 1
//     agreement = 100 × (1 − 0) × 1 = 100  -> Tinggi
//   Case B — split +1/−1, two of each, weights 1:
//     votes = [+1,+1,−1,−1] (all non-zero), σ² = 1, mean(w) = 1
//     agreement = 100 × (1 − 1) × 1 = 0    -> Rendah
//
// All public exports are pure and deterministic.

import type { Chart4, Domain, EngineName, RuleResult, Vote } from './mappings'
import { DOMAINS, ENGINES, MAPPINGS, ruleFor } from './mappings'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type DomainLabel = 'Tinggi' | 'Sedang' | 'Rendah'

/** One engine's contribution to a domain score. */
export interface EngineDetail {
  engine: EngineName
  domain: Domain
  vote: Vote
  weight: number
  alasanSingkat: string
}

/** The full result for one domain. */
export interface DomainScore {
  domain: Domain
  /** Per-engine breakdown (4 entries, in ENGINES order). */
  details: readonly EngineDetail[]
  /** 0-100 agreement score. */
  agreement: number
  label: DomainLabel
}

// ---------------------------------------------------------------------------
// Agreement formula
// ---------------------------------------------------------------------------

/**
 * Population variance over a non-empty numeric array. Returns 0 for a single
 * element (no spread) — matching the formula's intent (unanimity ⇒ 0 spread).
 */
function populationVariance(xs: readonly number[]): number {
  if (xs.length === 0) return 0
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  const sq = xs.reduce((a, x) => a + (x - mean) ** 2, 0)
  return sq / xs.length
}

/**
 * The explicit agreement formula:
 *   agreement = 100 × (1 − σ²(votes)) × mean(w)
 * σ² is computed over engines with vote ≠ 0; mean(w) is over ALL engines.
 * If every engine abstains (all votes 0), agreement is 0 — no signal.
 */
export function agreement(details: readonly EngineDetail[]): number {
  const allWeights = details.map((d) => d.weight)
  const signalVotes = details
    .filter((d) => d.vote !== 0)
    .map((d) => d.vote)
  if (signalVotes.length === 0) return 0
  const variance = populationVariance(signalVotes)
  const meanWeight = allWeights.reduce((a, b) => a + b, 0) / allWeights.length
  const raw = 100 * (1 - variance) * meanWeight
  // Clamp to [0, 100] — variance of {-1,+1} pairs is exactly 1, yielding 0;
  // floating-point noise could push slightly negative.
  return Math.max(0, Math.min(100, raw))
}

/** Label per the fixed thresholds. */
export function labelFor(score: number): DomainLabel {
  if (score >= 70) return 'Tinggi'
  if (score >= 40) return 'Sedang'
  return 'Rendah'
}

// ---------------------------------------------------------------------------
// Scoring entry points
// ---------------------------------------------------------------------------

/**
 * Score one domain across all four engines. Pure and deterministic.
 * Returns the per-engine breakdown + aggregated agreement + label.
 */
export function scoreDomain(chart: Chart4, domain: Domain): DomainScore {
  const details: EngineDetail[] = ENGINES.map((engine) => {
    const result: RuleResult = ruleFor(engine, domain)(chart)
    return {
      engine: result.engine,
      domain: result.domain,
      vote: result.vote,
      weight: result.weight,
      alasanSingkat: result.alasanSingkat,
    }
  })
  const score = agreement(details)
  return {
    domain,
    details,
    agreement: Math.round(score * 100) / 100,
    label: labelFor(score),
  }
}

/**
 * Score all four domains. Returns a record keyed by Domain for direct lookup.
 */
export function scoreAll(chart: Chart4): Record<Domain, DomainScore> {
  const out = {} as Record<Domain, DomainScore>
  for (const d of DOMAINS) out[d] = scoreDomain(chart, d)
  return out
}

// Re-export the mapping registry for consumers that want rule metadata.
export { MAPPINGS }
