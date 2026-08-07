// src/pages/__tests__/Dashboard.test.tsx
//
// Verifies the dashboard renders and that the real BaZi pipeline is
// deterministic and birth-driven (no Math.random). Uses react-dom/server
// static markup (no jsdom, matching the InputPage test pattern).

// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Dashboard } from '../Dashboard'
import {
  buildDashboardData,
  buildDailyForecast,
  DASHBOARD_DOMAINS,
} from '../dashboard-data'
import type { BirthData } from '../../core/birth/types'

const STUB_BIRTH: BirthData = {
  dateISO: '2000-01-01',
  timeISO: '12:00',
  lat: -6.2,
  lng: 106.8,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  isTimeEstimated: false,
  gender: 'male',
}

const OTHER_BIRTH: BirthData = {
  ...STUB_BIRTH,
  dateISO: '1990-12-25',
  timeISO: '03:15',
}

function renderDashboard(): string {
  return renderToStaticMarkup(
    createElement(Dashboard, { birthData: STUB_BIRTH, onReset: () => {} }),
  )
}

describe('Dashboard', () => {
  it('renders all 4 horizon tab labels', () => {
    const html = renderDashboard()
    expect(html).toContain('Harian')
    expect(html).toContain('Mingguan')
    expect(html).toContain('Bulanan')
    expect(html).toContain('Tahunan')
  })

  it('renders a horizon tlDr with agreement label + 2 domain names + 2 scores', () => {
    const html = renderDashboard()
    expect(html).toMatch(/persetujuan (Tinggi|Sedang|Rendah)/)
    expect(html).toMatch(/teratas \(skor \d+\)/)
    expect(html).toMatch(/paling perlu hati-hati \(skor \d+\)/)
    const domainsPresent = DASHBOARD_DOMAINS.filter((d) => html.includes(d))
    expect(domainsPresent.length).toBeGreaterThanOrEqual(2)
  })

  it('renders 4 domain cards (Karier/Cinta/Kesehatan/Keuangan)', () => {
    const html = renderDashboard()
    for (const d of DASHBOARD_DOMAINS) {
      expect(html).toContain(d)
    }
  })

  it('builds 4 horizons, deterministically, per birth data', () => {
    const a = buildDashboardData(STUB_BIRTH)
    const b = buildDashboardData(STUB_BIRTH)
    expect(a.length).toBe(4)
    for (let i = 0; i < 4; i++) {
      expect(a[i]!.horizon).toBe(b[i]!.horizon)
      expect(a[i]!.horizonTlDr).toBe(b[i]!.horizonTlDr)
      expect(a[i]!.domains.length).toBe(4)
      for (let j = 0; j < 4; j++) {
        const score = a[i]!.domains[j]!.score.agreement
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
        expect(score).toBe(b[i]!.domains[j]!.score.agreement)
      }
    }
  })

  it('is birth-driven: a different birth date yields different scores', () => {
    const a = buildDashboardData(STUB_BIRTH)
    const b = buildDashboardData(OTHER_BIRTH)
    let anyDiffers = false
    for (let i = 0; i < a.length && !anyDiffers; i++) {
      for (let j = 0; j < 4; j++) {
        if (a[i]!.domains[j]!.score.agreement !== b[i]!.domains[j]!.score.agreement) {
          anyDiffers = true
          break
        }
      }
    }
    expect(anyDiffers).toBe(true)
  })

  it('each domain has 4 engine details with non-empty vote, weight, alasanSingkat', () => {
    const data = buildDashboardData(STUB_BIRTH)
    for (const horizon of data) {
      for (const entry of horizon.domains) {
        expect(entry.score.details.length).toBe(4)
        for (const d of entry.score.details) {
          expect([-1, 0, 1]).toContain(d.vote)
          expect(d.weight).toBeGreaterThan(0)
          expect(d.weight).toBeLessThanOrEqual(1)
          expect(d.alasanSingkat).toBeTruthy()
          expect(d.engine).toBeTruthy()
        }
      }
    }
  })

  it('trend has exactly 30 points, all in [0,100]', () => {
    const data = buildDashboardData(STUB_BIRTH)
    for (const horizon of data) {
      for (const entry of horizon.domains) {
        expect(entry.trend.length).toBe(30)
        for (const p of entry.trend) {
          expect(p).toBeGreaterThanOrEqual(0)
          expect(p).toBeLessThanOrEqual(100)
        }
      }
    }
  })
})

describe('Dashboard daily (harian) forecast list', () => {
  it('builds 7 consecutive days', () => {
    const days = buildDailyForecast(STUB_BIRTH)
    expect(days.length).toBe(7)
    for (let i = 1; i < days.length; i++) {
      const next = new Date(days[i - 1]!.dateISO)
      next.setUTCDate(next.getUTCDate() + 1)
      expect(days[i]!.dateISO).toBe(next.toISOString().slice(0, 10))
    }
  })

  it('labels the first three days Hari ini/Besok/Lusa', () => {
    const days = buildDailyForecast(STUB_BIRTH)
    expect(days[0]!.relativeLabel).toBe('Hari ini')
    expect(days[1]!.relativeLabel).toBe('Besok')
    expect(days[2]!.relativeLabel).toBe('Lusa')
    expect(days[3]!.relativeLabel.length).toBeGreaterThan(0)
  })

  it('formats compact Indonesian date labels', () => {
    const days = buildDailyForecast(STUB_BIRTH)
    for (const day of days) {
      expect(day.dateLabel).toMatch(/^\w{3}, \d{1,2} \w{3} \d{4}$/)
    }
  })

  it('has 4 domain scores in [0,100] and a narrative tlDr per day', () => {
    const days = buildDailyForecast(STUB_BIRTH)
    for (const day of days) {
      expect(day.domains.length).toBe(4)
      for (const d of day.domains) {
        expect(d.score).toBeGreaterThanOrEqual(0)
        expect(d.score).toBeLessThanOrEqual(100)
      }
      expect(day.tlDr.length).toBeGreaterThan(0)
      expect(day.tlDr).toMatch(/persetujuan (Tinggi|Sedang|Rendah)/)
    }
  })

  it('is deterministic per birth data', () => {
    const a = buildDailyForecast(STUB_BIRTH)
    const b = buildDailyForecast(STUB_BIRTH)
    for (let i = 0; i < a.length; i++) {
      expect(a[i]!.dateISO).toBe(b[i]!.dateISO)
      expect(a[i]!.tlDr).toBe(b[i]!.tlDr)
      for (let j = 0; j < 4; j++) {
        expect(a[i]!.domains[j]!.score).toBe(b[i]!.domains[j]!.score)
      }
    }
  })

  it('renders the 7-day list in the default harian tab', () => {
    const html = renderDashboard()
    expect(html).toContain('Hari ini')
    expect(html).toContain('Besok')
    expect(html).toContain('Lusa')
    expect(html.match(/teratas \(skor \d+\)/g)!.length).toBe(7)
  })
})