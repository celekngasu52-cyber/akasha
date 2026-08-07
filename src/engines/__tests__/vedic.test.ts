// src/engines/__tests__/vedic.test.ts — tests for the Vedic (sidereal) engine.
//
// Golden source of truth: tests/golden/vedic/case1.json, captured from
// prokerala.com (a third-party Vedic calculator, per the plan's
// anti-circularity rule). The fixture header records source, url, and
// capturedAt. The fixture is READ AT RUNTIME via import.meta.glob (not
// bundled at compile time) so the engine is tested against the exact
// golden JSON.
//
// The engine computes sidereal (Lahiri) positions, lagna, rasi, nakshatra,
// pada, and vimshottari maha-dasha by delegating to the swisseph wrapper
// (todo 4). Prokerala uses the same Lahiri ayanamsa + tropical-ascendant
// minus ayanamsa convention, so positions should match to the precision
// prokerala reports (4-6 decimals). Dasha boundaries are dates; per the
// acceptance criteria, tolerance is ±1 day.

import { describe, it, expect } from 'vitest'
import type { BirthData } from '../../core/birth'
import { computeVedicChart } from '../vedic'
import type {
  VedicChart,
  SiderealPosition,
  DashaPeriod,
} from '../vedic/types'

// --- fixture types (mirror tests/golden/vedic/case1.json shape) ---

interface FixtureHeader {
  source: string
  url: string
  dashaUrl: string
  capturedAt: string
  birthData: {
    birthDateTime: string
    gender: string
    lat: number
    lng: number
    tzIANA: string
    placeName: string
  }
  note?: string
}

interface FixturePosition {
  name?: string
  siderealLongitudeDeg: number
  degInRasi?: number
  rasiIndex: number
  rasiName: string
  rasiLord?: string
  nakshatra?: string
  nakshatraIndex?: number
  nakshatraLord?: string
  pada?: number
}

interface FixtureDasha {
  lord: string
  startISO: string
  endISO: string
  durationYears: number
}

interface Fixture {
  header: FixtureHeader
  ayanamsa: number
  ascendant: FixturePosition
  moon: FixturePosition
  planets: FixturePosition[]
  vimshottariDasha: FixtureDasha[]
}

// --- runtime fixture loading (typed via vite/client, no node:* import) ---

// `query: '?raw', import: 'default'` yields the file's raw string content;
// import.meta.glob's type param is the parsed shape we JSON.parse into.
const GOLDEN = import.meta.glob<string>('../../../tests/golden/vedic/case*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function loadFixture(name: string): Fixture {
  const key = Object.keys(GOLDEN).find((k) => k.endsWith(`${name}.json`))
  if (!key) throw new Error(`fixture ${name} not found`)
  // JSON.parse returns unknown; cast per issues.md (cast the parse result).
  return JSON.parse(GOLDEN[key]) as Fixture
}

function birthFromHeader(h: FixtureHeader): BirthData {
  const [dateISO, timeISO] = h.birthData.birthDateTime.split('T')
  return {
    dateISO,
    timeISO,
    lat: h.birthData.lat,
    lng: h.birthData.lng,
    tzIANA: h.birthData.tzIANA,
    placeName: h.birthData.placeName,
    isTimeEstimated: false,
  }
}

/** Tolerance for dasha date boundaries: ±1 day per acceptance criteria. */
const DAY_MS = 86_400_000

function withinDays(isoA: string, isoB: string, tolDays: number): boolean {
  const a = Date.parse(isoA)
  const b = Date.parse(isoB)
  if (Number.isNaN(a) || Number.isNaN(b)) return false
  return Math.abs(a - b) <= tolDays * DAY_MS
}

// --- tests ---

describe('Vedic (sidereal) engine', () => {
  it('matches the golden fixture: lagna sign, moon rasi, nakshatra+pada, dasha', async () => {
    const f = loadFixture('case1')
    const bd = birthFromHeader(f.header)
    const chart: VedicChart = await computeVedicChart(bd)

    // Lagna (ascendant) rasi sign.
    expect(chart.lagna.rasiIndex).toBe(f.ascendant.rasiIndex)
    expect(chart.lagna.rasiName).toBe(f.ascendant.rasiName)

    // Moon rasi (rasi sign).
    expect(chart.moon.rasiIndex).toBe(f.moon.rasiIndex)
    expect(chart.moon.rasiName).toBe(f.moon.rasiName)

    // Moon nakshatra + pada (vimshottari dasha lord is the nakshatra lord).
    expect(chart.moon.nakshatraIndex).toBe(f.moon.nakshatraIndex)
    expect(chart.moon.nakshatraName).toBe(f.moon.nakshatra)
    expect(chart.moon.nakshatraLord).toBe(f.moon.nakshatraLord)
    expect(chart.moon.pada).toBe(f.moon.pada)

    // Vimshottari maha-dasha: 9 periods, lords in sequence, boundaries ±1 day.
    const fd = f.vimshottariDasha
    expect(chart.dasha).toHaveLength(fd.length)
    for (let i = 0; i < fd.length; i++) {
      const got: DashaPeriod = chart.dasha[i]
      const want: FixtureDasha = fd[i]
      expect(got.lord).toBe(want.lord)
      expect(got.durationYears).toBe(want.durationYears)
      expect(withinDays(got.startISO, want.startISO, 1)).toBe(true)
      expect(withinDays(got.endISO, want.endISO, 1)).toBe(true)
    }
  })

  it('determinism: same birth data produces deep-equal charts', async () => {
    const f = loadFixture('case1')
    const bd = birthFromHeader(f.header)
    const c1 = await computeVedicChart(bd)
    const c2 = await computeVedicChart(bd)
    expect(c2).toEqual(c1)
  })

  it('dasha sums to 120 years (full vimshottari cycle)', async () => {
    const f = loadFixture('case1')
    const bd = birthFromHeader(f.header)
    const chart = await computeVedicChart(bd)
    const total = chart.dasha.reduce((s, d) => s + d.durationYears, 0)
    expect(total).toBe(120)
  })
})
