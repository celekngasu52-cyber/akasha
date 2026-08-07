// src/core/birth/types.ts — shared types, error class, and range bounds
// for the birth data input model.

/** A birth event input as supplied by the caller (time may be unknown). */
export interface BirthData {
  /** ISO calendar date, e.g. "2000-01-01" (gregorian). */
  dateISO: string
  /** ISO time "HH:mm" or "HH:mm:ss", or null when time is unknown. */
  timeISO: string | null
  /** Geographic latitude in decimal degrees, -90..90 (north positive). */
  lat: number
  /** Geographic longitude in decimal degrees, -180..180 (east positive). */
  lng: number
  /** IANA timezone identifier, e.g. "Asia/Jakarta". */
  tzIANA: string
  /** Human-readable place name for the coordinates. */
  placeName: string
  /** True iff timeISO was derived/estimated rather than recorded. */
  isTimeEstimated: boolean
  /** True iff the IANA tz lacked data for the date and a fallback was used. */
  tzApproximated?: boolean
  /** Optional sex: 'male' or 'female', used by gender-dependent engine reads. */
  gender?: 'male' | 'female'
}

/** Result of LMT offset computation, expressed several ways. */
export interface LMTOffset {
  /** Signed offset in seconds from UTC (east positive). */
  offsetSeconds: number
  /** Whole hours of the offset (signed, e.g. 7 or -8). */
  hh: number
  /** Whole minutes 0..59 (always non-negative). */
  mm: number
  /** Whole seconds 0..59 (always non-negative). */
  ss: number
}

/** Result of resolving a timezone for a given date. */
export interface ResolvedTimezone {
  /** The IANA identifier that was resolved (may equal the input). */
  tzIANA: string
  /** UTC offset in minutes for the resolved date (east positive). */
  offsetMinutes: number
  /** True iff the standard-offset fallback was used (pre-1970 / no data). */
  approximated: boolean
}

/**
 * Thrown by validateBirthData() when a field is out of contract.
 * Carries the offending field name for programmatic handling.
 */
export class BirthValidationError extends Error {
  readonly field: string
  constructor(field: string, message: string) {
    super(message)
    this.name = 'BirthValidationError'
    this.field = field
  }
}

// Shared geographic range bounds; used by validation and LMT computation.
export const LAT_MIN = -90
export const LAT_MAX = 90
export const LNG_MIN = -180
export const LNG_MAX = 180
