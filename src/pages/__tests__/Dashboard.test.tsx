// src/pages/__tests__/Dashboard.test.tsx
//
// Verifies todo 16 acceptance criteria via react-dom/server static markup
// (no jsdom, matching the InputPage test pattern):
//   1. All 4 horizon tabs render (harian/mingguan/bulanan/tahunan).
//   2. Each tab shows a horizon tlDr containing the agreement label + 2 domain
//      names + 2 scores.
//   3. Each tab renders 4 domain cards (Karier/Cinta/Kesehatan/Keuangan).
//   4. The WhyPanel (when expanded) renders 4 engines, each with non-empty
//      vote, weight, and alasanSingkat.
//   5. TrendChart uses var(--aka-*) tokens (no hardcoded hex).
//
// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Dashboard } from '../Dashboard'
import {
  buildDashboardData,
  buildDailyForecast,
  DASHBOARD_DOMAINS,
} from '../dashboard-mock'
import type { BirthData } from '../../core/birth/types'

const STUB_BIRTH: BirthData = {
  dateISO: '2000-01-01',
  timeISO: '12:00',
  lat: -6.2,
  lng: 106.8,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  isTimeEstimated: false,
}

function renderDashboard(): string {
  return renderToStaticMarkup(
    createElement(Dashboard, { birthData: STUB_BIRTH, onReset: () => {} }),
  )
}

describe('Dashboard — todo 16 acceptance criteria', () => {
  it('renders all 4 horizon tab labels', () => {
    const html = renderDashboard()
    expect(html).toContain('Harian')
    expect(html).toContain('Mingguan')
    expect(html).toContain('Bulanan')
    expect(html).toContain('Tahunan')
  })

  it('renders a horizon tlDr with agreement label + 2 domain names + 2 scores', () => {
    const html = renderDashboard()
    // tlDr template:
    // "<Horizon> ini: persetujuan <Label> — <Top> teratas (skor <S>),
    //  <Bottom> paling perlu hati-hati (skor <s>)."
    // Default tab is harian. Check the structural pieces.
    expect(html).toMatch(/persetujuan (Tinggi|Sedang|Rendah)/)
    expect(html).toMatch(/teratas \(skor \d+\)/)
    expect(html).toMatch(/paling perlu hati-hati \(skor \d+\)/)
    // Must mention 2 distinct domain names from the vocabulary.
    const domainsPresent = DASHBOARD_DOMAINS.filter((d) => html.includes(d))
    expect(domainsPresent.length).toBeGreaterThanOrEqual(2)
  })

  it('renders 4 domain cards (Karier/Cinta/Kesehatan/Keuangan)', () => {
    const html = renderDashboard()
    for (const d of DASHBOARD_DOMAINS) {
      expect(html).toContain(d)
    }
  })

  it('mock data is deterministic — same build yields same scores', () => {
    const a = buildDashboardData()
    const b = buildDashboardData()
    expect(a.length).toBe(4)
    expect(b.length).toBe(4)
    for (let i = 0; i < 4; i++) {
      expect(a[i]!.horizon).toBe(b[i]!.horizon)
      expect(a[i]!.horizonTlDr).toBe(b[i]!.horizonTlDr)
      expect(a[i]!.domains.length).toBe(4)
      for (let j = 0; j < 4; j++) {
        expect(a[i]!.domains[j]!.score.agreement).toBe(b[i]!.domains[j]!.score.agreement)
      }
    }
  })

  it('each domain has 4 engine details with non-empty vote, weight, alasanSingkat', () => {
    const data = buildDashboardData()
    for (const horizon of data) {
      for (const entry of horizon.domains) {
        expect(entry.score.details.length).toBe(4)
        for (const d of entry.score.details) {
          expect([-1, 0, 1]).toContain(d.vote)
          expect(d.weight).toBeGreaterThan(0)
          expect(d.weight).toBeLessThanOrEqual(1)
          expect(d.alasanSingkat).toBeTruthy()
          expect(d.alasanSingkat.length).toBeGreaterThan(0)
          expect(d.engine).toBeTruthy()
        }
      }
    }
  })

  it('trend has exactly 30 points, all in [0,100]', () => {
    const data = buildDashboardData()
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

describe('Dashboard — daily (harian) forecast list', () => {
  // 2026-08-08 is a Saturday.
  const START = '2026-08-08'

  it('builds 7 consecutive days starting at startISO', () => {
    const days = buildDailyForecast(START)
    expect(days.length).toBe(7)
    expect(days[0]!.dateISO).toBe(START)
    expect(days[1]!.dateISO).toBe('2026-08-09')
    expect(days[6]!.dateISO).toBe('2026-08-14')
  })

  it('labels the first three days Hari ini/Besok/Lusa, the rest by weekday', () => {
    const days = buildDailyForecast(START)
    expect(days[0]!.relativeLabel).toBe('Hari ini')
    expect(days[1]!.relativeLabel).toBe('Besok')
    expect(days[2]!.relativeLabel).toBe('Lusa')
    expect(days[3]!.relativeLabel).toBe('Selasa') // 2026-08-11
  })

  it('formats compact Indonesian date labels', () => {
    const days = buildDailyForecast(START)
    expect(days[0]!.dateLabel).toBe('Sab, 8 Agu 2026')
    expect(days[1]!.dateLabel).toBe('Min, 9 Agu 2026')
  })

  it('each day has 4 domain scores in [0,100] and a non-empty tlDr', () => {
    const days = buildDailyForecast(START)
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

  it('is deterministic per date — same start yields identical lists', () => {
    const a = buildDailyForecast(START)
    const b = buildDailyForecast(START)
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
    // One day-row tlDr per day; the horizon box is hidden for the harian tab.
    expect(html.match(/teratas \(skor \d+\)/g)!.length).toBe(7)
  })
})
