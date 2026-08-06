// src/core/birth/tz.ts — Timezone resolution with a pre-1970 fallback path.

import type { ResolvedTimezone } from './types'
import { BirthValidationError } from './types'
import { isValidIANATimezone } from './validation'

/**
 * Resolve the UTC offset for a given IANA timezone and date.
 *
 * Primary path: use Intl.DateTimeFormat to read the offset the runtime
 * reports for the given instant. The Intl provider has full IANA data
 * for modern dates (post-1970) and most historical ones.
 *
 * Fallback path: if the runtime reports no usable offset (returns null
 * or throws), use the city's standard UTC offset from a small
 * well-known-zones table, and mark approximated=true. This covers the
 * pre-1970 case where some runtimes lack IANA historical data.
 */
export function resolveTimezone(
  tzIANA: string,
  date: Date,
): ResolvedTimezone {
  if (!isValidIANATimezone(tzIANA)) {
    throw new BirthValidationError(
      'tzIANA',
      `tzIANA "${tzIANA}" is not a valid IANA timezone`,
    )
  }
  const probeMinutes = probeIntlOffsetMinutes(tzIANA, date)
  if (probeMinutes !== null) {
    return { tzIANA, offsetMinutes: probeMinutes, approximated: false }
  }
  const std = STANDARD_OFFSETS[tzIANA]
  if (std !== undefined) {
    return { tzIANA, offsetMinutes: std, approximated: true }
  }
  // Unknown zone with no standard-offset entry: surface zero and mark
  // approximated so downstream code is honest. Callers that know the
  // longitude should pass the LMT offset separately.
  return { tzIANA, offsetMinutes: 0, approximated: true }
}

/**
 * Read the UTC offset (minutes, east positive) that Intl reports for the
 * given tz at the given instant. Returns null when the runtime cannot
 * provide it (rare; typically only for malformed or stripped zones).
 */
function probeIntlOffsetMinutes(tzIANA: string, date: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tzIANA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'longOffset',
    }).formatToParts(date)
    const tzPart = parts.find((p) => p.type === 'timeZoneName')
    if (!tzPart || !tzPart.value) return null
    const m = /GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?/.exec(tzPart.value)
    if (!m) {
      // Some runtimes emit "GMT" with no offset for UTC; treat as 0.
      if (tzPart.value === 'GMT' || tzPart.value === 'UTC') return 0
      return null
    }
    const sign = m[1] === '-' ? -1 : 1
    const hh = Number(m[2])
    const mm = Number(m[3])
    const ss = m[4] === undefined ? 0 : Number(m[4])
    return sign * (hh * 60 + mm + ss / 60)
  } catch {
    return null
  }
}

/**
 * Standard (non-DST) UTC offsets for a small set of well-known cities,
 * used only when Intl cannot resolve a zone for the requested historical
 * date. Extended as needed; missing zones fall back to a longitude-derived
 * LMT in resolveTimezone() callers.
 */
const STANDARD_OFFSETS: Readonly<Record<string, number>> = {
  'Asia/Jakarta': 420, // +07:00 WIB
  'Asia/Makassar': 480, // +08:00 WITA
  'Asia/Jayapura': 540, // +09:00 WIT
  'Asia/Bangkok': 420,
  'Asia/Singapore': 480,
  'Asia/Tokyo': 540,
  'Asia/Hong_Kong': 480,
  'Asia/Kolkata': 330,
  'Europe/London': 0,
  'Europe/Paris': 60,
  'America/New_York': -300,
  'America/Los_Angeles': -480,
  'Australia/Sydney': 600,
}
