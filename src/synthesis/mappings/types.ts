// src/synthesis/mappings/types.ts — public types for the cross-engine rules.
//
// One rule per (engine × domain) pair — 4 engines × 4 domains = 16 explicit
// entries. Each rule is a pure function: same Chart4 slice -> same vote,
// weight, and template-driven alasanSingkat. No free text; the sentence is
// filled from the rule condition that determined the vote (todo 16 "Kenapa?"
// panel).
//
// Domain vocabulary + element tokens (decision recorded in decisions.md):
//   Karier     — 官 (officer) + 印 (resource)
//   Cinta      — 财 (wealth) [gender-aware: +官 for female, +财 for male]
//   Kesehatan  — 日主-support (resource + same-element, i.e. 印 + 比劫)
//   Keuangan    — 财 (wealth) + 食 (output)
// ≤2 stem + ≤2 branch tokens per domain.
//
// Vote ∈ {-1, 0, +1}; weight w ∈ [0, 1]. The agreement formula lives in
// scorer.ts; this file owns only the per-engine rule evaluation.
//
// All public exports are pure and deterministic.

import type { FourPillars, Strength, TenGods } from '../../engines/bazi/types'
import type { ZiWeiChart } from '../../engines/ziwei/types'
import type { VedicChart } from '../../engines/vedic/types'
import type { WesternChart } from '../../engines/western/types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** The four engine charts fed to the scorer. */
export interface Chart4 {
  bazi: { pillars: FourPillars; strength: Strength; tenGods: TenGods }
  ziwei: ZiWeiChart
  vedic: VedicChart
  western: WesternChart
}

/** The four life domains. Fixed vocabulary (decision in decisions.md). */
export type Domain = 'Karier' | 'Cinta' | 'Kesehatan' | 'Keuangan'

export const DOMAINS: readonly Domain[] = [
  'Karier',
  'Cinta',
  'Kesehatan',
  'Keuangan',
] as const

/** Vote cast by an engine rule for one domain. */
export type Vote = -1 | 0 | 1

/** Result of one rule evaluation: the per-engine contribution. */
export interface RuleResult {
  engine: EngineName
  domain: Domain
  vote: Vote
  /** Confidence weight in [0, 1]. */
  weight: number
  /** One template-driven sentence naming the rule condition (todo 16). */
  alasanSingkat: string
}

/** The four engines, in fixed canonical order. */
export type EngineName = 'BaZi' | 'ZiWei' | 'Vedic' | 'Western'

export const ENGINES: readonly EngineName[] = [
  'BaZi',
  'ZiWei',
  'Vedic',
  'Western',
] as const

// ---------------------------------------------------------------------------
// Rule signature + registry shape
// ---------------------------------------------------------------------------

/**
 * A rule maps the Chart4 slice for one engine to a RuleResult for one domain.
 * Pure and deterministic. Returns a template alasanSingkat — the caller fills
 * rule-condition tokens, never free text.
 */
export type Rule = (chart: Chart4) => RuleResult

/** One registry entry: (engine, domain) -> rule + human-readable condition. */
export interface MappingEntry {
  engine: EngineName
  domain: Domain
  /** Human-readable condition, e.g. "day master strong ∧ resource menonjol". */
  condition: string
  /** Tokens the rule inspects (for the "Kenapa?" panel + tests). */
  tokens: readonly string[]
  rule: Rule
}
