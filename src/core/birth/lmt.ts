// src/core/birth/lmt.ts — Local Mean Time offset from longitude, and the
// unknown-time -> 12:00 LMT substitution.

import type { BirthData, LMTOffset } from './types'
import { BirthValidationError, LNG_MAX, LNG_MIN } from './types'
import { normaliseBirthData } from './validation'

/**
 * Compute the Local Mean Time offset from UTC for a given longitude.
 *
 * LMT is the solar-mean-time convention: the local clock is offset from
 * UTC by exactly (longitude / 15) hours, since Earth rotates 360° per 24h.
 * East longitudes are positive -> ahead of UTC; west negative -> behind.
 *
 * Example: Jakarta 106.8456°E -> +7.12304h = +7h 07m 23.5s.
 */
export function calculateLMT(lng: number): LMTOffset {
  if (!Number.isFinite(lng) || lng < LNG_MIN || lng > LNG_MAX) {
    throw new BirthValidationError(
      'lng',
      `lng ${lng} out of range [${LNG_MIN}, ${LNG_MAX}]`,
    )
  }
  const offsetSecondsTotal = Math.round((lng / 15) * 3600)
  const sign = offsetSecondsTotal < 0 ? -1 : 1
  const abs = Math.abs(offsetSecondsTotal)
  const hh = sign * Math.floor(abs / 3600)
  const mm = Math.floor((abs % 3600) / 60)
  const ss = abs % 60
  return { offsetSeconds: offsetSecondsTotal, hh, mm, ss }
}

/**
 * Given a BirthData and a UTC instant, resolve the local time. When
 * timeISO is null, substitute 12:00 LMT (noon local mean time, NOT the
 * city's civil-zone noon). Returns the LMT offset and the effective local
 * time string "HH:mm:ss".
 *
 * LMT is the mean-sun convention; EOT corrects mean to apparent solar
 * time and is exposed separately (see equationOfTime()).
 */
export function resolveBirthTimeLMT(
  data: BirthData,
  utcInstant: Date,
): { lmt: LMTOffset; effectiveTimeISO: string } {
  const normalised = normaliseBirthData(data)
  const lmt = calculateLMT(normalised.lng)
  if (normalised.timeISO !== null) {
    return { lmt, effectiveTimeISO: padTime(normalised.timeISO) }
  }
  // Unknown time -> default 12:00 LMT (noon, local mean time).
  const noonUTCms =
    utcInstant.getTime() -
    (utcInstant.getUTCHours() * 3600 +
      utcInstant.getUTCMinutes() * 60 +
      utcInstant.getUTCSeconds()) *
      1000 -
    utcInstant.getUTCMilliseconds() +
    12 * 3600 * 1000
  const localMs = noonUTCms + lmt.offsetSeconds * 1000
  const ld = new Date(localMs)
  const hh = String(ld.getUTCHours()).padStart(2, '0')
  const mm = String(ld.getUTCMinutes()).padStart(2, '0')
  const ss = String(ld.getUTCSeconds()).padStart(2, '0')
  return { lmt, effectiveTimeISO: `${hh}:${mm}:${ss}` }
}

/** "HH:mm" -> "HH:mm:00"; "HH:mm:ss" left alone. */
function padTime(t: string): string {
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`
  return t
}
