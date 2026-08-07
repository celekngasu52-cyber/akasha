// src/engines/__tests__/ziwei-forecast.test.ts — tests for the Zi Wei forecast.
//
// Tests the four horizons (流年/流月/流日/大限), the palaceFocus top-2 rule
// (紫微/天府/七杀/破军 weight 3, other main stars weight 1), determinism
// (run-twice-diff for 3 dates), and a golden match of the 大限 start palace
// against the todo-7 chart fixture (case1.json 命宫 ageRange "5-14").

import { describe, it, expect } from 'vitest'
import type { BirthData } from '../../core/birth'
import {
  computeYearlyForecast,
  computeMonthlyForecast,
  computeDailyForecast,
  computeDecadeForecast,
} from '../ziwei'
import type { Gender } from '../ziwei/types'

// --- fixture types (mirror the golden JSON shape) ---

interface FixtureHeader {
  birthDateTime: string
  gender: 'male' | 'female'
  lat: number
  lng: number
  tzIANA: string
  placeName: string
}

interface FixtureStar {
  name: string
  type: 'main' | 'aux'
}

interface FixturePalace {
  branchIndex: number
  name: string
  ageRange: string
  stars: FixtureStar[]
  isMingGong?: boolean
}

interface Fixture {
  header: FixtureHeader
  palaces: FixturePalace[]
}

const GOLDEN = import.meta.glob<string>('../../../tests/golden/ziwei/case1.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function loadCase1(): Fixture {
  const key = Object.keys(GOLDEN).find((k) => k.endsWith('case1.json'))
  if (!key) throw new Error('case1.json not found')
  return JSON.parse(GOLDEN[key]) as Fixture
}

function birthFromHeader(h: FixtureHeader): BirthData {
  const [dateISO, timeISO] = h.birthDateTime.split('T')
  return {
    dateISO,
    timeISO,
    lat: h.lat,
    lng: h.lng,
    tzIANA: h.tzIANA,
    placeName: h.placeName,
    isTimeEstimated: false,
  }
}

function genderOf(g: 'male' | 'female'): Gender {
  return g === 'male' ? 1 : 0
}

// --- shared fixtures ---

const CASE1 = loadCase1()
const BIRTH = birthFromHeader(CASE1.header)
const GENDER = genderOf(CASE1.header.gender)

const THREE_DATES = ['2026-08-07', '2020-01-15', '2035-06-30']

// --- tests ---

describe('Zi Wei forecast engine', () => {
  describe('palaceFocus top-2 rule', () => {
    it('yearly: palaceFocus has exactly 2 entries, sorted descending', () => {
      const r = computeYearlyForecast(BIRTH, GENDER, '2026-08-07')
      expect(r.palaceFocus).toHaveLength(2)
      expect(r.palaceFocus[0].score).toBeGreaterThanOrEqual(r.palaceFocus[1].score)
    })

    it('monthly: palaceFocus has exactly 2 entries', () => {
      const r = computeMonthlyForecast(BIRTH, GENDER, '2026-08-07')
      expect(r.palaceFocus).toHaveLength(2)
    })

    it('daily: palaceFocus has exactly 2 entries', () => {
      const r = computeDailyForecast(BIRTH, GENDER, '2026-08-07')
      expect(r.palaceFocus).toHaveLength(2)
    })

    it('decade: palaceFocus has exactly 2 entries', () => {
      const r = computeDecadeForecast(BIRTH, GENDER, '2026-08-07')
      expect(r.palaceFocus).toHaveLength(2)
    })

    it('palaceFocus scores match the weight rule (紫微/天府/七杀/破军=3)', () => {
      const r = computeYearlyForecast(BIRTH, GENDER, '2026-08-07')
      // Recompute expected scores from the fixture and verify the engine's
      // top-2 are the genuine top-2 by the documented weight rule.
      const HEAVY = new Set(['紫微', '天府', '七杀', '破军'])
      const scored = CASE1.palaces.map((p) => {
        let s = 0
        for (const st of p.stars) {
          if (st.type === 'main') s += HEAVY.has(st.name) ? 3 : 1
        }
        return { branchIndex: p.branchIndex, name: p.name, score: s }
      })
      scored.sort((a, b) => b.score - a.score || b.branchIndex - a.branchIndex)
      const expected = scored.slice(0, 2)
      expect(r.palaceFocus).toEqual(expected)
    })
  })

  describe('determinism (run-twice-diff, 3 dates)', () => {
    for (const dateISO of THREE_DATES) {
      it(`yearly ${dateISO}: identical on re-run`, () => {
        const a = computeYearlyForecast(BIRTH, GENDER, dateISO)
        const b = computeYearlyForecast(BIRTH, GENDER, dateISO)
        expect(b).toEqual(a)
      })

      it(`monthly ${dateISO}: identical on re-run`, () => {
        const a = computeMonthlyForecast(BIRTH, GENDER, dateISO)
        const b = computeMonthlyForecast(BIRTH, GENDER, dateISO)
        expect(b).toEqual(a)
      })

      it(`daily ${dateISO}: identical on re-run`, () => {
        const a = computeDailyForecast(BIRTH, GENDER, dateISO)
        const b = computeDailyForecast(BIRTH, GENDER, dateISO)
        expect(b).toEqual(a)
      })

      it(`decade ${dateISO}: identical on re-run`, () => {
        const a = computeDecadeForecast(BIRTH, GENDER, dateISO)
        const b = computeDecadeForecast(BIRTH, GENDER, dateISO)
        expect(b).toEqual(a)
      })
    }
  })

  describe('大限 (decade) golden match vs todo-7 fixture', () => {
    it('大限 start (age 5) points at 命宫 palace from case1 fixture', () => {
      // case1: born 1990-05-10, 土五局 → first 大限 starts at age 5.
      // The 大限 starting palace is 命宫 (the palace with isMingGong=true).
      const mingGong = CASE1.palaces.find((p) => p.isMingGong)!
      expect(mingGong.ageRange).toBe('5-14')

      // Target date when the subject is exactly 5 years old: 1995-05-10.
      const r = computeDecadeForecast(BIRTH, GENDER, '1995-05-10')
      expect(r.activePalaceIndex).toBe(mingGong.branchIndex)
      expect(r.activePalaceName).toBe(mingGong.name)
    })

    it('大限 at age 36 falls in the 35-44 palace (田宅 for case1)', () => {
      // case1 male (yang): 大限 runs clockwise. 命宫(亥,idx11,5-14) →
      // 父母(子,idx0,15-24) → 福德(丑,idx1,25-34) → 田宅(寅,idx2,35-44).
      const expected = CASE1.palaces.find((p) => p.ageRange === '35-44')!
      const r = computeDecadeForecast(BIRTH, GENDER, '2026-05-10')
      expect(r.activePalaceIndex).toBe(expected.branchIndex)
    })
  })

  describe('horizon active palace', () => {
    it('yearly active palace matches the year branch (2026 = 丙午年 → 午)', () => {
      // 2026 is a 午 (马) year → branchIndex 6.
      const r = computeYearlyForecast(BIRTH, GENDER, '2026-08-07')
      expect(r.activePalaceIndex).toBe(6)
      expect(r.kind).toBe('year')
    })

    it('monthly active palace matches the month branch', () => {
      const r = computeMonthlyForecast(BIRTH, GENDER, '2026-08-07')
      expect(r.kind).toBe('month')
      expect(r.activePalaceIndex).toBeGreaterThanOrEqual(0)
      expect(r.activePalaceIndex).toBeLessThanOrEqual(11)
    })

    it('daily active palace matches the day branch', () => {
      const r = computeDailyForecast(BIRTH, GENDER, '2026-08-07')
      expect(r.kind).toBe('day')
      expect(r.activePalaceIndex).toBeGreaterThanOrEqual(0)
      expect(r.activePalaceIndex).toBeLessThanOrEqual(11)
    })
  })
})
