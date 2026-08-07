// src/engines/western/sun-math.ts — solar-return math helpers.
//
// Extracted from chart.ts to keep both modules under the 300-line budget.
// Pure functions only; no swisseph wrapper calls except the julday/jdut
// function shapes passed in by the caller (chart.ts owns wrapper access).

/** Normalize an angle to [0, 360). */
export function norm360(deg: number): number {
  const m = deg % 360
  return m < 0 ? m + 360 : m
}

/** sind in degrees. */
function sind(d: number): number {
  return Math.sin((d * Math.PI) / 180)
}

/** Tropical longitude of the Sun at a UT Julian Day (synthetic, ~0.01° acc). */
export function sunLongitudeAt(jd: number): number {
  // Low-precision mean Sun formula (Meeus, Astronomical Algorithms).
  const T = (jd - 2451545.0) / 36525
  const L0 = 280.46646 + 36000.76983 * T
  const M = 357.52911 + 35999.05029 * T
  const C =
    (1.914602 - 0.004817 * T) * sind(M) +
    0.019993 * sind(2 * M) +
    0.000289 * sind(3 * M)
  const trueLong = L0 + C
  return norm360(trueLong)
}

/**
 * Find the UT Julian Day in `year` when the Sun's tropical longitude equals
 * `natalSun`. Uses a secant method seeded near the expected return date
 * (~365.24 days after the previous return). Converges in a handful of steps.
 */
export function findSolarReturnJD(
  swe: { julday: (y: number, m: number, d: number, h: number) => number },
  year: number,
  natalSun: number,
): number {
  // Seed: January 1 of the return year, 12:00 UT (rough natal anniversary).
  let jd = swe.julday(year, 1, 1, 12)
  for (let i = 0; i < 30; i++) {
    const sunLon = sunLongitudeAt(jd)
    let diff = natalSun - sunLon
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    if (Math.abs(diff) < 1e-6) return jd
    // The Sun moves ~0.9856°/day; step by the degree gap in days.
    jd += diff / 0.9856473
  }
  return jd
}

type SweJdutFn = (jd: number, gregflag: number) => {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

/** Convert a UT Julian Day to an ISO-8601 UTC string. */
export function jdToISO(swe: { jdut1_to_utc: SweJdutFn }, jd: number): string {
  const d = swe.jdut1_to_utc(jd, 1)
  const { year: Y, month: M, day: D, hour: h, minute: mi, second: s } = d
  const ms = Math.round((s % 1) * 1000)
  const ss = Math.floor(s)
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${Y}-${pad(M)}-${pad(D)}T${pad(h)}:${pad(mi)}:${pad(ss)}.${pad(ms, 3)}Z`
}
