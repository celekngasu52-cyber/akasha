// src/synthesis/mappings/index.ts — barrel re-export for the rule registry.
//
// Mechanical split of the original src/synthesis/mappings.ts (todo 1 F2
// debt). Public exports are unchanged; importers use `from './mappings'`
// and resolve to this barrel. No behavior change — same types, same rules,
// same registry, same lookup.
//
// Modules:
//   types.ts         — public types (Chart4, Domain, Vote, RuleResult, ...)
//   bazi-rules.ts    — BaZi helpers + 4 BaZi rules
//   ziwei-rules.ts   — ZiWei helpers + 4 ZiWei rules
//   vedic-rules.ts   — Vedic helpers + rule factory
//   western-rules.ts — Western helpers + rule factory
//   registry.ts      — the 16-entry MAPPINGS + ruleFor

export type {
  Chart4,
  Domain,
  Vote,
  RuleResult,
  EngineName,
  Rule,
  MappingEntry,
} from './types'

export { DOMAINS, ENGINES } from './types'

export { MAPPINGS, ruleFor } from './registry'
