import { describe, it, expect } from 'vitest'
import type { BirthData } from '../../core/birth'
import {
  computeDailyForecast,
  computeWeeklyForecast,
  computeMonthlyForecast,
  computeYearlyForecast,
} from '../bazi'
import type { ForecastHorizon } from '../bazi/types'
import fixture from '../../../tests/golden/bazi/forecast.json'

/**
 * Tests for the BaZi forecast engine (流年/流月/流日).
 *
 * Golden source of truth: tests/golden/bazi/forecast.json, captured directly
 * from lunar-javascript 1.7.7 — the same deterministic library the engine
 * wraps — for the case1 birth (1990-05-10T12:00 Asia/Jakarta, male). Each
 * fixture case records the target pillars, five-element scores, and the
 * standard gan-zhi interactions. Engine output must match exactly.
 *
 * Determinism contract: same BirthData + gender + target date -> same output,
 * because lunar-javascript is deterministic given an explicit wall-clock
 * {y,m,d,h,mi,s} tuple and the interaction tables are pure lookups.
 */

const birth: BirthData = {
  dateISO: '1990-05-10',
  timeISO: '12:00',
  lat: -6.2088,
  lng: 106.8456,
  tzIANA: 'Asia/Jakarta',
}
const gender = 1 as const // male

interface FixtureCase {
  id: string
  kind: 'daily' | 'weekly' | 'monthly' | 'yearly'
  targetISO: string
  pillars: { slot: string; ganZhi: string; stem: string; branch: string }[]
  elementScores: Record<string, number>
  interactions: Record<string, string[]>
  activeLuck?: { ganZhi: string; startYear: number; endYear: number }
  days?: FixtureCase[]
}

const cases = fixture.cases as FixtureCase[]

const byId = (id: string): FixtureCase => {
  const c = cases.find((x) => x.id === id)
  if (!c) throw new Error(`missing fixture case ${id}`)
  return c
}

describe('bazi forecast — daily', () => {
  it('matches the golden fixture for three target dates', () => {
    const ids = ['daily-2026-08-07', 'daily-2026-08-08', 'daily-2026-08-09']
    for (const id of ids) {
      const c = byId(id)
      const result = computeDailyForecast(birth, gender, c.targetISO)
      expect(result.kind).toBe('daily')
      expect(result.targetISO).toBe(c.targetISO)
      expect(result.pillars).toEqual(c.pillars)
      expect(result.elementScores).toEqual(c.elementScores)
      expect(result.interactions).toEqual(c.interactions)
      expect(result.activeLuck).toBeUndefined()
      expect(result.days).toBeUndefined()
    }
  })

  it('is deterministic: repeat runs are deep-equal for three dates', () => {
    const dates = ['2026-08-07', '2026-08-08', '2026-08-09']
    for (const iso of dates) {
      const a = computeDailyForecast(birth, gender, iso)
      const b = computeDailyForecast(birth, gender, iso)
      expect(a).toEqual(b)
    }
  })

  it('exposes all five element scores for the daily horizon', () => {
    const result = computeDailyForecast(birth, gender, '2026-08-07')
    const keys = Object.keys(result.elementScores).sort()
    expect(keys).toEqual(['earth', 'fire', 'metal', 'water', 'wood'])
    const total = Object.values(result.elementScores).reduce((s, n) => s + n, 0)
    // 3 pillars * (stem weight 2 + branch weight 1) = 9
    expect(total).toBe(9)
  })

  it('fixture pillar assertion: daily-2026-08-07 day pillar is 癸丑', () => {
    const result = computeDailyForecast(birth, gender, '2026-08-07')
    const dayPillar = result.pillars.find((p) => p.slot === 'day')
    expect(dayPillar?.ganZhi).toBe('癸丑')
    expect(dayPillar?.stem).toBe('癸')
    expect(dayPillar?.branch).toBe('丑')
  })
})

describe('bazi forecast — weekly', () => {
  it('matches the golden fixture anchor and exposes seven days', () => {
    const c = byId('weekly-2026-08-07')
    const result = computeWeeklyForecast(birth, gender, '2026-08-07')
    expect(result.kind).toBe('weekly')
    expect(result.targetISO).toBe('2026-08-07')
    expect(result.pillars).toEqual(c.pillars)
    expect(result.elementScores).toEqual(c.elementScores)
    expect(result.interactions).toEqual(c.interactions)
    expect(result.days).toHaveLength(7)
    expect(result.activeLuck).toBeUndefined()
  })

  it('each weekly day is deep-equal to the standalone daily forecast', () => {
    const weekly = computeWeeklyForecast(birth, gender, '2026-08-07')
    const start = new Date(Date.UTC(2026, 7, 7))
    for (let i = 0; i < 7; i++) {
      const dt = new Date(start.getTime() + i * 86_400_000)
      const iso = `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
      const daily = computeDailyForecast(birth, gender, iso)
      expect(weekly.days?.[i]).toEqual(daily)
    }
  })

  it('is deterministic: repeat runs are deep-equal', () => {
    const a = computeWeeklyForecast(birth, gender, '2026-08-07')
    const b = computeWeeklyForecast(birth, gender, '2026-08-07')
    expect(a).toEqual(b)
  })

  it('exposes all five element scores on each weekly day', () => {
    const weekly = computeWeeklyForecast(birth, gender, '2026-08-07')
    for (const day of weekly.days ?? []) {
      const keys = Object.keys(day.elementScores).sort()
      expect(keys).toEqual(['earth', 'fire', 'metal', 'water', 'wood'])
    }
  })
})

describe('bazi forecast — monthly', () => {
  it('matches the golden fixture for 2026-08 with active luck', () => {
    const c = byId('monthly-2026-08')
    const result = computeMonthlyForecast(birth, gender, 2026, 8)
    expect(result.kind).toBe('monthly')
    expect(result.targetISO).toBe('2026-08-15')
    expect(result.pillars).toEqual(c.pillars)
    expect(result.elementScores).toEqual(c.elementScores)
    expect(result.interactions).toEqual(c.interactions)
    expect(result.activeLuck).toEqual(c.activeLuck)
    expect(result.days).toBeUndefined()
  })

  it('active luck covers the target year', () => {
    const result = computeMonthlyForecast(birth, gender, 2026, 8)
    const al = result.activeLuck
    expect(al).toBeDefined()
    expect(al!.startYear).toBeLessThanOrEqual(2026)
    expect(al!.endYear).toBeGreaterThanOrEqual(2026)
  })

  it('is deterministic: repeat runs are deep-equal', () => {
    const a = computeMonthlyForecast(birth, gender, 2026, 8)
    const b = computeMonthlyForecast(birth, gender, 2026, 8)
    expect(a).toEqual(b)
  })

  it('exposes all five element scores for the monthly horizon', () => {
    const result = computeMonthlyForecast(birth, gender, 2026, 8)
    const keys = Object.keys(result.elementScores).sort()
    expect(keys).toEqual(['earth', 'fire', 'metal', 'water', 'wood'])
  })
})

describe('bazi forecast — yearly', () => {
  it('matches the golden fixture for 2026 with active luck', () => {
    const c = byId('yearly-2026')
    const result = computeYearlyForecast(birth, gender, 2026)
    expect(result.kind).toBe('yearly')
    expect(result.targetISO).toBe('2026-01-01')
    expect(result.pillars).toEqual(c.pillars)
    expect(result.elementScores).toEqual(c.elementScores)
    expect(result.interactions).toEqual(c.interactions)
    expect(result.activeLuck).toEqual(c.activeLuck)
    expect(result.days).toBeUndefined()
  })

  it('active luck covers the target year', () => {
    const result = computeYearlyForecast(birth, gender, 2026)
    const al = result.activeLuck
    expect(al).toBeDefined()
    expect(al!.startYear).toBeLessThanOrEqual(2026)
    expect(al!.endYear).toBeGreaterThanOrEqual(2026)
  })

  it('is deterministic: repeat runs are deep-equal', () => {
    const a = computeYearlyForecast(birth, gender, 2026)
    const b = computeYearlyForecast(birth, gender, 2026)
    expect(a).toEqual(b)
  })

  it('exposes all five element scores for the yearly horizon', () => {
    const result = computeYearlyForecast(birth, gender, 2026)
    const keys = Object.keys(result.elementScores).sort()
    expect(keys).toEqual(['earth', 'fire', 'metal', 'water', 'wood'])
  })
})

describe('bazi forecast — interactions surface', () => {
  it('all four interaction kinds are always present on every horizon', () => {
    const horizons: ForecastHorizon[] = [
      computeDailyForecast(birth, gender, '2026-08-07'),
      computeWeeklyForecast(birth, gender, '2026-08-07'),
      computeMonthlyForecast(birth, gender, 2026, 8),
      computeYearlyForecast(birth, gender, 2026),
    ]
    for (const h of horizons) {
      expect(Object.keys(h.interactions).sort()).toEqual(
        ['clashes', 'combines', 'controls', 'stemCombines'],
      )
    }
  })

  it('detects the branch combine on daily-2026-08-08 (甲寅 combines with 亥)', () => {
    const result = computeDailyForecast(birth, gender, '2026-08-08')
    expect(result.interactions.combines).toContain('甲寅')
  })
})

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
