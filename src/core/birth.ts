// src/core/birth.ts — Birth data input model (barrel).
//
// Re-exports the public surface of the birth model. Implementations live
// in sibling modules under ./birth/ (types, validation, lmt, eot, tz).
//
// All public functions are pure and deterministic: same input -> same output.

export type {
  BirthData,
  LMTOffset,
  ResolvedTimezone,
} from './birth/types'
export { BirthValidationError } from './birth/types'
export {
  validateBirthData,
  normaliseBirthData,
  isValidIANATimezone,
} from './birth/validation'
export { calculateLMT, resolveBirthTimeLMT } from './birth/lmt'
export { equationOfTime } from './birth/eot'
export { resolveTimezone } from './birth/tz'
