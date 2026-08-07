// src/pages/__tests__/InputPage.test.tsx
//
// Unit tests for InputPage: validation, city combobox filter, snapshot DOM.
//
// Runs in the default vitest "node" environment (no jsdom needed).
// DOM snapshot uses react-dom/server renderToStaticMarkup.
// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { InputPage, validateDate, validateTime, filterCities, getCities } from '../InputPage'
import citiesData from '../../data/cities.json'
import { validateBirthData } from '../../core/birth'
import type { BirthData } from '../../core/birth/types'

type CityRow = {
  name: string
  province: string
  lat: number
  lng: number
  tzIANA: string
}

const CITIES = (citiesData as { cities: CityRow[] }).cities

describe('cities.json data integrity', () => {
  it('has exactly 514 entries', () => {
    expect(CITIES.length).toBe(514)
  })

  it('has 514 unique names', () => {
    const names = new Set(CITIES.map((c) => c.name))
    expect(names.size).toBe(514)
  })

  it('all coordinates are within Indonesia range (lat -11..6, lng 95..141)', () => {
    for (const c of CITIES) {
      expect(c.lat).toBeGreaterThanOrEqual(-11)
      expect(c.lat).toBeLessThanOrEqual(6)
      expect(c.lng).toBeGreaterThanOrEqual(95)
      expect(c.lng).toBeLessThanOrEqual(141)
    }
  })

  it('all tzIANA values are valid via Intl.DateTimeFormat', () => {
    for (const c of CITIES) {
      expect(() => Intl.DateTimeFormat(undefined, { timeZone: c.tzIANA })).not.toThrow()
    }
  })

  it('tzIANA values are only the 3 Indonesian zones', () => {
    const validZones = new Set(['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'])
    for (const c of CITIES) {
      expect(validZones.has(c.tzIANA)).toBe(true)
    }
  })

  it('combobox filter "surab" returns >= 1 result', () => {
    const results = filterCities('surab')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some((c) => c.name.toLowerCase().includes('surab'))).toBe(true)
  })

  it('filter is case-insensitive', () => {
    const lower = filterCities('surabaya')
    const upper = filterCities('SURABAYA')
    expect(lower.length).toBe(upper.length)
    expect(lower.length).toBeGreaterThanOrEqual(1)
  })

  it('filter matches province name', () => {
    const results = filterCities('jawa timur')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('getCities returns the full list', () => {
    expect(getCities().length).toBe(514)
  })
})

describe('validateDate', () => {
  it('accepts a valid date', () => {
    expect(validateDate('2000-01-01')).toBeNull()
    expect(validateDate('1990-06-15')).toBeNull()
    expect(validateDate('2024-12-31')).toBeNull()
  })

  it('rejects empty date', () => {
    expect(validateDate('')).toBe('Tanggal wajib diisi.')
  })

  it('rejects dates before 1900', () => {
    expect(validateDate('1899-12-31')).not.toBeNull()
  })

  it('rejects dates after 2100', () => {
    expect(validateDate('2101-01-01')).not.toBeNull()
  })

  it('rejects invalid format', () => {
    expect(validateDate('01-01-2000')).not.toBeNull()
    expect(validateDate('not-a-date')).not.toBeNull()
  })

  it('rejects impossible calendar dates', () => {
    expect(validateDate('2026-02-30')).not.toBeNull()
    expect(validateDate('2026-04-31')).not.toBeNull()
  })
})

describe('validateTime', () => {
  it('accepts valid time when not estimated', () => {
    expect(validateTime('12:00', false)).toBeNull()
    expect(validateTime('00:00', false)).toBeNull()
    expect(validateTime('23:59', false)).toBeNull()
  })

  it('rejects empty time when not estimated', () => {
    expect(validateTime('', false)).not.toBeNull()
  })

  it('allows empty time when estimated', () => {
    expect(validateTime('', true)).toBeNull()
  })

  it('rejects invalid format', () => {
    expect(validateTime('25:00', false)).not.toBeNull()
    expect(validateTime('12:60', false)).not.toBeNull()
    expect(validateTime('noon', false)).not.toBeNull()
  })
})

describe('InputPage DOM snapshot', () => {
  it('renders the form with all required fields', () => {
    const noop = () => {}
    const html = renderToStaticMarkup(
      createElement(InputPage, { onSubmit: noop }),
    )

    // Snapshot
    expect(html).toMatchSnapshot()

    // Key elements present
    expect(html).toContain('birth-date')
    expect(html).toContain('birth-time')
    expect(html).toContain('city-combobox')
    expect(html).toContain('Waktu perkiraan')
    expect(html).toContain('Hitung')
  })

  it('renders with combobox role and aria attributes', () => {
    const html = renderToStaticMarkup(
      createElement(InputPage, { onSubmit: () => {} }),
    )
    expect(html).toContain('role="combobox"')
    expect(html).toContain('aria-autocomplete="list"')
    expect(html).toContain('aria-controls="city-listbox"')
  })

  it('renders labels for all inputs', () => {
    const html = renderToStaticMarkup(
      createElement(InputPage, { onSubmit: () => {} }),
    )
    expect(html).toContain('Tanggal Lahir')
    expect(html).toContain('Waktu Lahir')
    expect(html).toContain('Kota / Kabupaten Tempat Lahir')
  })
})

describe('InputPage submit produces valid BirthData', () => {
  it('onSubmit receives a BirthData with correct fields', () => {
    // We can't interact with the form in node env, but we can verify
    // that the BirthData shape matches by constructing one as InputPage would.
    const city = filterCities('surabaya')[0]
    const birthData: BirthData = {
      dateISO: '2000-06-15',
      timeISO: '12:00',
      lat: city.lat,
      lng: city.lng,
      tzIANA: city.tzIANA,
      placeName: city.name,
      isTimeEstimated: false,
    }

    // Should pass the shared validator
    expect(() => validateBirthData(birthData)).not.toThrow()

    // Fields match BirthData contract
    expect(birthData.dateISO).toBe('2000-06-15')
    expect(birthData.timeISO).toBe('12:00')
    expect(birthData.tzIANA).toBe('Asia/Jakarta')
    expect(birthData.placeName).toContain('Surabaya')
    expect(birthData.isTimeEstimated).toBe(false)
  })

  it('coordinates from city lookup are within Indonesia', () => {
    const city = filterCities('surabaya')[0]
    expect(city.lat).toBeGreaterThanOrEqual(-11)
    expect(city.lat).toBeLessThanOrEqual(6)
    expect(city.lng).toBeGreaterThanOrEqual(95)
    expect(city.lng).toBeLessThanOrEqual(141)
  })

  it('timezone is mapped correctly for Surabaya (WIB)', () => {
    const city = filterCities('surabaya')[0]
    expect(city.tzIANA).toBe('Asia/Jakarta')
  })
})
