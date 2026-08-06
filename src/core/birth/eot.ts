// src/core/birth/eot.ts — Equation of Time (NOAA / Broussard approximation).

/**
 * Equation of Time in minutes, using the NOAA / Broussard approximation.
 *
 * The EOT is the difference between apparent solar time (sundial) and
 * mean solar time (clock). It arises from Earth's orbital eccentricity
 * and axial tilt, and varies through the year within roughly +/- 20 min.
 *
 * Formula (Broussard; widely used NOAA-style approximation):
 *   B = (2π / 365) * (dayOfYear - 81)      [radians]
 *   EOT = 9.87 * sin(2B) - 7.53 * cos(B) - 1.5 * sin(B)   [minutes]
 *
 * @param date - the calendar date to evaluate. UTC date is used so the
 *   result is independent of the host's local timezone.
 * @returns EOT in minutes (positive => sundial ahead of clock).
 */
export function equationOfTime(date: Date): number {
  const dayOfYear = getUTCDayOfYear(date)
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b)
}

/** UTC day-of-year (1..366) for a Date. Deterministic across host tz. */
function getUTCDayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const cur = date.getTime()
  const oneDay = 86400000
  return Math.floor((cur - start) / oneDay)
}
