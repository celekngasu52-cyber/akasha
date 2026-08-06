import { describe, it, expect } from 'vitest'
import {
  getSwissEph,
  planets,
  housesPlacidus,
  ayanamsa,
} from '../swisseph'

/**
 * Tests for the swisseph-wasm wrapper.
 *
 * The expected longitudes below are transcribed verbatim from the golden
 * files at tests/golden/swetest/<epoch>.txt, which were generated from
 * swisseph-wasm@0.1.0 (Docker swetest was unavailable in this env). The
 * 0.05 deg tolerance matches the acceptance criterion; in practice the
 * wrapper reproduces the golden values to sub-arcsecond precision because
 * both use the same JPL-based Swiss Ephemeris.
 *
 * Golden source of truth: tests/golden/swetest/2000-01-01_12TT.txt and
 * tests/golden/swetest/2024-06-15_00TT.txt (kept in sync by hand).
 */

const TOLERANCE_DEG = 0.05

interface GoldenEpoch {
  /** Golden file the expected values were transcribed from. */
  goldenFile: string
  /** TT calendar input matching the golden header. */
  year: number
  month: number
  day: number
  hourTT: number
  /** Expected tropical Sun longitude (deg). */
  sunTropical: number
  /** Expected tropical Moon longitude (deg). */
  moonTropical: number
  /** Expected sidereal (Lahiri) Sun longitude (deg). */
  sunSidereal: number
  /** Expected sidereal (Lahiri) Moon longitude (deg). */
  moonSidereal: number
}

const EPOCHS: readonly GoldenEpoch[] = [
  {
    goldenFile: '2000-01-01_12TT.txt',
    year: 2000,
    month: 1,
    day: 1,
    hourTT: 12,
    sunTropical: 280.368919,
    moonTropical: 223.323751,
    sunSidereal: 256.515696,
    moonSidereal: 199.470529,
  },
  {
    goldenFile: '2024-06-15_00TT.txt',
    year: 2024,
    month: 6,
    day: 15,
    hourTT: 0,
    sunTropical: 84.398388,
    moonTropical: 182.852271,
    sunSidereal: 60.200734,
    moonSidereal: 158.654617,
  },
]

/** JD_UT for a TT calendar timestamp, via swe.julday + swe.deltat. */
async function jdUTFromTT(
  year: number,
  month: number,
  day: number,
  hourTT: number,
): Promise<number> {
  const swe = await getSwissEph()
  const jdTT = swe.julday(year, month, day, hourTT)
  return jdTT - swe.deltat(jdTT) / 86400
}

describe('swisseph wrapper — golden Sun/Moon', () => {
  for (const e of EPOCHS) {
    describe(e.goldenFile, () => {
      it('tropical Sun/Moon match golden within 0.05 deg', async () => {
        const jd = await jdUTFromTT(e.year, e.month, e.day, e.hourTT)
        const [sun, moon] = await planets(jd, ['sun', 'moon'])
        expect(Math.abs(sun.longitude - e.sunTropical)).toBeLessThan(
          TOLERANCE_DEG,
        )
        expect(Math.abs(moon.longitude - e.moonTropical)).toBeLessThan(
          TOLERANCE_DEG,
        )
        expect(sun.sidereal).toBe(false)
      })

      it('sidereal (Lahiri) Sun/Moon match golden within 0.05 deg', async () => {
        const jd = await jdUTFromTT(e.year, e.month, e.day, e.hourTT)
        const [sun, moon] = await planets(jd, ['sun', 'moon'], {
          sidereal: true,
        })
        expect(Math.abs(sun.longitude - e.sunSidereal)).toBeLessThan(
          TOLERANCE_DEG,
        )
        expect(Math.abs(moon.longitude - e.moonSidereal)).toBeLessThan(
          TOLERANCE_DEG,
        )
        expect(sun.sidereal).toBe(true)
      })
    })
  }
})

describe('swisseph wrapper — determinism', () => {
  it('two consecutive runs return identical Sun/Moon longitudes', async () => {
    const jd = await jdUTFromTT(2000, 1, 1, 12)
    const first = await planets(jd, ['sun', 'moon'])
    const second = await planets(jd, ['sun', 'moon'])
    expect(second[0].longitude).toBe(first[0].longitude)
    expect(second[1].longitude).toBe(first[1].longitude)
  })

  it('two consecutive ayanamsa calls return identical values', async () => {
    const jd = await jdUTFromTT(2024, 6, 15, 0)
    const first = await ayanamsa(jd)
    const second = await ayanamsa(jd)
    expect(second).toBe(first)
  })
})

describe('swisseph wrapper — polar Placidus fallback', () => {
  it('switches to whole-sign (WS) houses when |lat| > 66', async () => {
    const jd = await jdUTFromTT(2024, 6, 15, 0)
    const result = await housesPlacidus(jd, 70, 0)
    expect(result.houseSystem).toBe('WS')
    expect(result.polarFallback).toBe(true)
    expect(result.cusps).toHaveLength(12)
    expect(result.ascendant).toBeGreaterThanOrEqual(0)
  })

  it('uses Placidus (P) at a non-polar latitude', async () => {
    const jd = await jdUTFromTT(2024, 6, 15, 0)
    const result = await housesPlacidus(jd, 40, 0)
    expect(result.houseSystem).toBe('P')
    expect(result.polarFallback).toBe(false)
    expect(result.cusps).toHaveLength(12)
  })

  it('falls back to WS at extreme southern latitude', async () => {
    const jd = await jdUTFromTT(2024, 6, 15, 0)
    const result = await housesPlacidus(jd, -70, 0)
    expect(result.houseSystem).toBe('WS')
    expect(result.polarFallback).toBe(true)
  })
})

describe('swisseph wrapper — singleton contract', () => {
  it('getSwissEph returns the same instance across calls', async () => {
    const a = await getSwissEph()
    const b = await getSwissEph()
    expect(b).toBe(a)
  })
})
