// src/engines/__tests__/western.test.ts — tests for the Western (tropical) engine.
//
// Golden source of truth: tests/golden/western/case1.json, a self-snapshot
// captured from the swisseph engine (todo 4). The fixture header records
// source = "swisseph engine self-snapshot". The fixture is READ AT RUNTIME
// via import.meta.glob (not bundled at compile time) so the engine is tested
// against the exact golden JSON.
//
// Assertions: ascendant sign, sun sign, >=3 aspects (exact match), a polar
// (lat=70N) case asserting houseSystem === 'WS' (whole-sign fallback), and a
// determinism test (run twice, deep-equal).

import { describe, expect, it } from 'vitest'
import type { BirthData } from '../../core/birth/types'
import { computeNatalChart } from '../western'

interface FixtureBirth {
  birthDateTime: string
  lat: number
  lng: number
  tzIANA: string
}

interface FixtureHeader {
  birthData: FixtureBirth
}

interface FixturePosition {
  name: string
  longitudeDeg: number
  signIndex: number
}

interface FixtureAspect {
  bodyA: string
  bodyB: string
  type: string
  exactAngle: number
  actualSeparation: number
  orb: number
}

interface Fixture {
  header: FixtureHeader
  planets: FixturePosition[]
  angles: { ascendant: FixturePosition }
  aspects: FixtureAspect[]
}

// `query: '?raw', import: 'default'` yields the file's raw string content;
// import.meta.glob's type param is the parsed shape we JSON.parse into.
const GOLDEN = import.meta.glob<string>('../../../tests/golden/western/case*.json', {
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
    placeName: 'fixture',
    isTimeEstimated: false,
  }
}

/** Find a planet by name in a computed chart's planets array. */
function findPlanet(
  planets: { name: string; signIndex: number }[],
  name: string,
): { name: string; signIndex: number } {
  const p = planets.find((x) => x.name === name)
  if (!p) throw new Error(`planet ${name} not found`)
  return p
}

describe('western engine', () => {
  it('matches the golden ascendant sign and sun sign', async () => {
    const f = loadFixture('case1')
    const bd = birthFromHeader(f.header)
    const chart = await computeNatalChart(bd)

    expect(chart.angles.ascendant.signIndex).toBe(f.angles.ascendant.signIndex)
    expect(findPlanet(chart.planets, 'sun').signIndex).toBe(
      findPlanet(f.planets, 'sun').signIndex,
    )
  })

  it('matches >=3 golden aspects exactly', async () => {
    const f = loadFixture('case1')
    const bd = birthFromHeader(f.header)
    const chart = await computeNatalChart(bd)

    expect(chart.aspects.length).toBeGreaterThanOrEqual(3)

    const expected = f.aspects.slice(0, 3)
    for (const e of expected) {
      const match = chart.aspects.find(
        (a) =>
          a.bodyA === e.bodyA &&
          a.bodyB === e.bodyB &&
          a.type === e.type,
      )
      expect(match, `aspect ${e.bodyA}-${e.bodyB} ${e.type} missing`).toBeDefined()
      expect(match!.exactAngle).toBe(e.exactAngle)
      expect(match!.actualSeparation).toBeCloseTo(e.actualSeparation, 5)
      expect(match!.orb).toBeCloseTo(e.orb, 5)
    }
  })

  it('falls back to whole-sign houses at lat=70N', async () => {
    const bd: BirthData = {
      dateISO: '1990-05-10',
      timeISO: '12:00',
      lat: 70,
      lng: 20,
      tzIANA: 'Europe/Oslo',
      placeName: 'polar',
      isTimeEstimated: false,
    }
    const chart = await computeNatalChart(bd)
    expect(chart.houseSystem).toBe('WS')
  })

  it('is deterministic: same birth data yields identical charts', async () => {
    const f = loadFixture('case1')
    const bd = birthFromHeader(f.header)
    const a = await computeNatalChart(bd)
    const b = await computeNatalChart(bd)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})
