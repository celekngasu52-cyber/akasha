// src/pages/input-utils.ts — pure helpers for the birth-data input form.
//
// Extracted from InputPage.tsx so the component file exports only components
// (required for Vite Fast Refresh). These functions are pure and deterministic.

import citiesData from '../data/cities.json'

export interface CityEntry {
  name: string
  province: string
  lat: number
  lng: number
  tzIANA: string
}

const CITIES: CityEntry[] = (citiesData as { cities: CityEntry[] }).cities

/** Max number of combobox suggestions shown at once. */
export const MAX_SUGGESTIONS = 50

/** Year bounds for valid birth dates. */
export const MIN_YEAR = 1900
export const MAX_YEAR = 2100

/** Expose the city list for tests and downstream consumers. */
export function getCities(): readonly CityEntry[] {
  return CITIES
}

/** Filter cities by query string (matches name or province, case-insensitive). */
export function filterCities(query: string, limit = MAX_SUGGESTIONS): CityEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return CITIES.slice(0, limit)
  return CITIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.province.toLowerCase().includes(q),
  ).slice(0, limit)
}

/**
 * Validate a date string in ISO "YYYY-MM-DD" format.
 * Returns an error message string, or null if valid.
 */
export function validateDate(dateISO: string): string | null {
  if (!dateISO) return 'Tanggal wajib diisi.'
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO)
  if (!match) return 'Format tanggal tidak valid (YYYY-MM-DD).'
  const year = Number(match[1])
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return `Tanggal harus antara ${MIN_YEAR} dan ${MAX_YEAR}.`
  }
  const d = new Date(dateISO)
  if (Number.isNaN(d.getTime())) return 'Tanggal tidak valid.'
  const parts = dateISO.split('-')
  const [y, m, day] = [Number(parts[0]), Number(parts[1]), Number(parts[2])]
  if (d.getUTCFullYear() !== y || d.getUTCMonth() + 1 !== m || d.getUTCDate() !== day) {
    return 'Tanggal tidak valid.'
  }
  return null
}

/**
 * Validate the time input. Empty time is allowed only if isTimeEstimated is true.
 */
export function validateTime(time: string, isEstimated: boolean): string | null {
  if (!time) {
    return isEstimated ? null : 'Waktu wajib diisi, atau centang "waktu perkiraan".'
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return 'Format waktu tidak valid (HH:MM).'
  }
  const [h, m] = time.split(':').map(Number)
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    return 'Waktu tidak valid.'
  }
  return null
}
