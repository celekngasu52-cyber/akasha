// src/core/birth/validation.ts — BirthData contract validation and the
// unknown-time normalisation rule.

import type { BirthData } from './types'
import { BirthValidationError, LAT_MAX, LAT_MIN, LNG_MAX, LNG_MIN } from './types'

/**
 * Validate a BirthData value. Throws BirthValidationError on the first
 * contract violation. Returns the input unchanged so callers can chain:
 * `const b = validateBirthData(raw)`.
 */
export function validateBirthData(data: BirthData): BirthData {
  if (!isValidISODate(data.dateISO)) {
    throw new BirthValidationError(
      'dateISO',
      `dateISO "${data.dateISO}" is not a valid ISO calendar date`,
    )
  }
  if (!isValidIANATimezone(data.tzIANA)) {
    throw new BirthValidationError(
      'tzIANA',
      `tzIANA "${data.tzIANA}" is not a valid IANA timezone`,
    )
  }
  if (!Number.isFinite(data.lat) || data.lat < LAT_MIN || data.lat > LAT_MAX) {
    throw new BirthValidationError(
      'lat',
      `lat ${data.lat} out of range [${LAT_MIN}, ${LAT_MAX}]`,
    )
  }
  if (!Number.isFinite(data.lng) || data.lng < LNG_MIN || data.lng > LNG_MAX) {
    throw new BirthValidationError(
      'lng',
      `lng ${data.lng} out of range [${LNG_MIN}, ${LNG_MAX}]`,
    )
  }
  if (data.timeISO !== null && !isValidISOTime(data.timeISO)) {
    throw new BirthValidationError(
      'timeISO',
      `timeISO "${data.timeISO}" is not a valid ISO time (HH:mm or HH:mm:ss)`,
    )
  }
  if (typeof data.placeName !== 'string' || data.placeName.trim() === '') {
    throw new BirthValidationError('placeName', 'placeName must be non-empty')
  }
  if (typeof data.isTimeEstimated !== 'boolean') {
    throw new BirthValidationError(
      'isTimeEstimated',
      'isTimeEstimated must be boolean',
    )
  }
  return data
}

/**
 * Apply unknown-time semantics and return a normalised BirthData.
 * If timeISO is null, sets isTimeEstimated=true. The caller is expected
 * to substitute 12:00 LMT downstream (see resolveBirthTimeLMT()).
 */
export function normaliseBirthData(data: BirthData): BirthData {
  validateBirthData(data)
  if (data.timeISO === null && !data.isTimeEstimated) {
    return { ...data, isTimeEstimated: true }
  }
  return data
}

/**
 * Returns true iff `tz` is a valid IANA timezone identifier, by probing
 * Intl.DateTimeFormat. Intl throws RangeError for unrecognised zones like
 * "Mars/Phobos". This is the canonical JS runtime check.
 */
export function isValidIANATimezone(tz: string): boolean {
  if (typeof tz !== 'string' || tz.length === 0) return false
  try {
    // formatToParts forces evaluation — some runtimes defer validation.
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).formatToParts(
      new Date('2000-01-01T00:00:00Z'),
    )
    return true
  } catch {
    return false
  }
}

function isValidISODate(s: string): boolean {
  if (typeof s !== 'string') return false
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12) return false
  if (d < 1 || d > 31) return false
  const dt = new Date(Date.UTC(y, mo - 1, d))
  // Date.UTC normalises overflow (e.g. month 13 -> next year). Reject that.
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  )
}

function isValidISOTime(s: string): boolean {
  if (typeof s !== 'string') return false
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s)
  if (!m) return false
  const h = Number(m[1])
  const mi = Number(m[2])
  const se = m[3] === undefined ? 0 : Number(m[3])
  if (h < 0 || h > 23) return false
  if (mi < 0 || mi > 59) return false
  if (se < 0 || se > 59) return false
  return true
}
