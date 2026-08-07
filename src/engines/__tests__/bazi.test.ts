import { describe, it, expect } from 'vitest'
import type { BirthData } from '../../core/birth'
import {
  computeFourPillars,
  computeStrength,
  computeLuckPillars,
  computeTenGods,
} from '../bazi'
import type { FourPillars, Gender, Pillar } from '../bazi/types'

/**
 * Tests for the BaZi (八字) engine.
 *
 * Golden source of truth: tests/golden/bazi/case{1..4}.json, captured from
 * throosden.github.io/bazi (a third-party calculator, per the plan's
 * anti-circularity rule). Each fixture header records source, url, and
 * capturedAt. The fixtures are READ AT RUNTIME via import.meta.glob (not
 * transcribed), so the on-disk JSON is the actual ground truth the engine
 * is compared against — no copy/drift risk. The engine must reproduce
 * every pillar's gan-zhi and the ten gods exactly; case1 additionally pins
 * all eight 大運 entries.
 *
 * The strength suite (tests/golden/bazi/strength.json) is synthetic: four
 * hand-scored FourPillars charts (2 strong, 2 weak) that exercise the
 * support/drain rule without a real birth date.
 */

// --- fixture JSON shapes (the on-disk form; engine types differ slightly) ---

interface FixturePillar {
  ganZhi: string
  stem: string
  branch: string
}

interface FixtureFourPillars {
  year: FixturePillar
  month: FixturePillar
  day: FixturePillar
  hour: FixturePillar
}

interface FixtureTenGodsSlot {
  stem: string
  /** Fixture field name is `branch`; the engine calls this `branches`. */
  branch: string[]
}

interface FixtureTenGods {
  year: FixtureTenGodsSlot
  month: FixtureTenGodsSlot
  day: FixtureTenGodsSlot
  hour: FixtureTenGodsSlot
}

interface FixtureLuckPillar {
  ganZhi: string
  startAge: number
  endAge: number
  startYear: number
  endYear: number
}

interface FixtureHeader {
  source: string
  url: string
  birthDateTime: string
  gender: 'male' | 'female'
  lat: number
  lng: number
  tzIANA: string
  placeName?: string
  note?: string
  capturedAt?: string
}

interface BaziFixture {
  header: FixtureHeader
  fourPillars: FixtureFourPillars
  dayMaster: string
  luckPillars?: FixtureLuckPillar[]
  tenGods: FixtureTenGods
}

interface StrengthCase {
  id: string
  pillars: FixtureFourPillars
  dayMaster: string
  expectedScore: number
  expectedVerdict: 'strong' | 'balanced' | 'weak'
}

interface StrengthFixture {
  header: { source: string; config: string; note: string; capturedAt: string }
  cases: StrengthCase[]
}

// --- runtime fixture loading (typed via vite/client, no node:* import) ---

// `query: '?raw', import: 'default'` yields the file's raw string content;
// import.meta.glob's type param is the parsed shape we JSON.parse into.
const GOLDEN = import.meta.glob<string>('../../../tests/golden/bazi/case*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const STRENGTH_RAW = import.meta.glob<string>(
  '../../../tests/golden/bazi/strength.json',
  { query: '?raw', import: 'default', eager: true },
)

function fixture(name: 'case1' | 'case2' | 'case3' | 'case4'): BaziFixture {
  const key = Object.keys(GOLDEN).find((k) => k.endsWith(`${name}.json`))
  if (!key) throw new Error(`fixture ${name}.json not found`)
  return JSON.parse(GOLDEN[key]) as BaziFixture
}

function strengthCases(): StrengthCase[] {
  const key = Object.keys(STRENGTH_RAW)[0]
  if (!key) throw new Error('strength.json not found')
  return (JSON.parse(STRENGTH_RAW[key]) as StrengthFixture).cases
}

// --- helpers ---

/** Build a BirthData from a fixture header (ISO split into date + time). */
function birthFromHeader(h: FixtureHeader): BirthData {
  // birthDateTime is "YYYY-MM-DDTHH:mm" (no seconds, no tz offset — the
  // tzIANA field carries the zone).
  const [dateISO, timeISO] = h.birthDateTime.split('T')
  return {
    dateISO,
    timeISO,
    lat: h.lat,
    lng: h.lng,
    tzIANA: h.tzIANA,
    placeName: h.placeName ?? '',
    isTimeEstimated: false,
  }
}

function toPillar(p: FixturePillar): Pillar {
  return { ganZhi: p.ganZhi, stem: p.stem, branch: p.branch }
}

function toFourPillars(fp: FixtureFourPillars): FourPillars {
  return {
    year: toPillar(fp.year),
    month: toPillar(fp.month),
    day: toPillar(fp.day),
    hour: toPillar(fp.hour),
  }
}

/** Map fixture ten-gods slot (branch[]) to engine shape (branches[]). */
function toEngineTenGods(tg: FixtureTenGods) {
  const map = (s: FixtureTenGodsSlot) => ({ stem: s.stem, branches: s.branch })
  return { year: map(tg.year), month: map(tg.month), day: map(tg.day), hour: map(tg.hour) }
}

function genderOf(g: 'male' | 'female'): Gender {
  return g === 'male' ? 1 : 0
}

const GOLDEN_NAMES = ['case1', 'case2', 'case3', 'case4'] as const

// --- tests ---

describe('bazi engine — golden fixtures', () => {
  for (const name of GOLDEN_NAMES) {
    describe(name, () => {
      const fx = fixture(name)

      it('reproduces all four pillars exactly', () => {
        expect(computeFourPillars(birthFromHeader(fx.header))).toEqual(
          toFourPillars(fx.fourPillars),
        )
      })

      it('day master equals the day stem', () => {
        const got = computeFourPillars(birthFromHeader(fx.header))
        expect(got.day.stem).toBe(fx.dayMaster)
      })

      it('reproduces the ten gods exactly', () => {
        expect(computeTenGods(birthFromHeader(fx.header))).toEqual(
          toEngineTenGods(fx.tenGods),
        )
      })
    })
  }

  // case1: full 大運 match (all 8 entries).
  it('case1: matches all 8 大運 entries (ganZhi + ages + years)', () => {
    const fx = fixture('case1')
    const got = computeLuckPillars(birthFromHeader(fx.header), genderOf(fx.header.gender))
    expect(fx.luckPillars).toBeDefined()
    expect(got).toEqual(fx.luckPillars)
  })

  // case2: 23:00 子时 boundary — day pillar stays current day, hour uses 子.
  it('case2 (23:00 子时): hour branch is 子, day pillar stays current day', () => {
    const fx = fixture('case2')
    const got = computeFourPillars(birthFromHeader(fx.header))
    expect(got.hour.branch).toBe('子')
    expect(got.day.ganZhi).toBe(fx.fourPillars.day.ganZhi)
  })

  // case3: imlek boundary (lunar 正月初一) — reproduced exactly by the loop.
  it('case3 (imlek 正月初一): reproduces the pillars (boundary sanity)', () => {
    const fx = fixture('case3')
    const got = computeFourPillars(birthFromHeader(fx.header))
    expect(got).toEqual(toFourPillars(fx.fourPillars))
  })

  // case4: Tokyo — reproduced exactly by the loop; kept explicit per AC.
  it('case4 (Tokyo): reproduces the pillars', () => {
    const fx = fixture('case4')
    const got = computeFourPillars(birthFromHeader(fx.header))
    expect(got).toEqual(toFourPillars(fx.fourPillars))
  })

  // AC #1: fixture header provenance for case1.
  it('case1 header records source, url, and capturedAt (provenance)', () => {
    const fx = fixture('case1')
    expect(fx.header.source).toBeTruthy()
    expect(fx.header.url).toMatch(/^https?:\/\//)
    expect(fx.header.capturedAt).toBeTruthy()
  })

  // Determinism: same input → identical output across two calls.
  it('determinism: computeFourPillars is pure across two calls', () => {
    const fx = fixture('case1')
    const data = birthFromHeader(fx.header)
    expect(computeFourPillars(data)).toEqual(computeFourPillars(data))
  })
})

describe('bazi engine — strength (synthetic, hand-scored)', () => {
  const cases = strengthCases()

  it('suite has 4 cases: 2 strong + 2 weak', () => {
    expect(cases).toHaveLength(4)
    const v = cases.map((c) => c.expectedVerdict)
    expect(v.filter((x) => x === 'strong')).toHaveLength(2)
    expect(v.filter((x) => x === 'weak')).toHaveLength(2)
  })

  for (const c of cases) {
    it(`${c.id}: verdict ${c.expectedVerdict} (score ${c.expectedScore})`, () => {
      const result = computeStrength(toFourPillars(c.pillars))
      expect(result.verdict).toBe(c.expectedVerdict)
      expect(result.score).toBe(c.expectedScore)
    })

    it(`${c.id}: documented day master matches the day stem`, () => {
      expect(c.pillars.day.stem).toBe(c.dayMaster)
    })
  }
})
