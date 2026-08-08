// src/pages/dashboard-dates.ts — Indonesian date helpers for the dashboard.
//
// Extracted from dashboard-data.ts as a mechanical split (todo 1 F2 debt).
// Pure helpers, no locale API, deterministic. Used to format ISO dates and
// relative labels (Hari ini / Besok / Lusa / weekday) for the daily forecast.

const DAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const

const pad2 = (n: number): string => String(n).padStart(2, '0')

/** Today's ISO date (yyyy-mm-dd) from a Date object. */
export function isoOfDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Add n days to an ISO date, returning a new ISO date. */
export function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d! + n))
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

/** Weekday index (0=Sunday) for an ISO date, using UTC to avoid tz drift. */
export function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
}

/** Format an ISO date as "Sen, 5 Agu 2026". */
export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${DAYS_SHORT[weekdayIndex(iso)]}, ${d} ${MONTHS_SHORT[m! - 1]} ${y}`
}

/** Relative label for a day index (0=today, 1=tomorrow, 2=day after, else weekday). */
export function relativeLabelFor(dayIndex: number, iso: string): string {
  if (dayIndex === 0) return 'Hari ini'
  if (dayIndex === 1) return 'Besok'
  if (dayIndex === 2) return 'Lusa'
  return DAYS_LONG[weekdayIndex(iso)]!
}
