// src/ui/charts/__tests__/charts.test.tsx
//
// Verifies todo 17 acceptance criteria via react-dom/server static markup
// (no jsdom, matching the Dashboard test pattern):
//   1. All 4 charts render against fixture data (budi_19900510) without
//      throwing.
//   2. Each markup contains data-chart="..." and aria-label.
//   3. Determinism: render each chart twice → identical markup strings.
//   4. Markup contains no raster image elements and no external URL references.
//   5. Markup contains fill="var(--aka- (at least one per chart).
//
// Fixture values are transcribed from tests/golden/personas/budi_19900510.json
// and shaped into the engine types. resolveJsonModule is OFF in tsconfig, so
// the fixture is inlined as typed objects (no JSON import).
//
// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { BaziGrid } from '../BaziGrid'
import { ZiweiPalace } from '../ZiweiPalace'
import { WesternWheel } from '../WesternWheel'
import { VedicChart } from '../VedicChart'
import type { FourPillars, TenGods } from '../../../engines/bazi/types'
import type { ZiWeiChart } from '../../../engines/ziwei/types'
import type {
  WesternChart,
  WesternBody,
} from '../../../engines/western/types'
import type {
  VedicChart as VedicChartType,
  VedicBody,
} from '../../../engines/vedic/types'

// --- BaZi fixture (from budi_19900510.json expectedCharts.bazi) ---
function pillar(ganZhi: string): { ganZhi: string; stem: string; branch: string } {
  return { ganZhi, stem: ganZhi[0]!, branch: ganZhi[1]! }
}
const BAZI_PILLARS: FourPillars = {
  year: pillar('庚午'),
  month: pillar('辛巳'),
  day: pillar('乙亥'),
  hour: pillar('壬午'),
}
const BAZI_TENGODS: TenGods = {
  year: { stem: '正官', branches: ['食神', '偏财'] },
  month: { stem: '七杀', branches: ['伤官', '正官', '正财'] },
  day: { stem: '日主', branches: ['正印', '劫财'] },
  hour: { stem: '正印', branches: ['食神', '偏财'] },
}

// --- ZiWei fixture (from budi_19900510.json expectedCharts.ziwei) ---
const BRANCH_INDEX: Record<string, number> = {
  '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5,
  '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11,
}
const ZIWEI_PALACES_RAW: Array<{
  name: string; branch: string; stars: string[]
}> = [
  { name: '命宫', branch: '亥', stars: ['天相'] },
  { name: '父母', branch: '子', stars: ['天梁'] },
  { name: '福德', branch: '丑', stars: ['廉贞', '七杀'] },
  { name: '交友', branch: '辰', stars: ['天同'] },
  { name: '迁移', branch: '巳', stars: ['武曲', '破军'] },
  { name: '疾厄', branch: '午', stars: ['太阳'] },
  { name: '财帛', branch: '未', stars: ['天府'] },
  { name: '子女', branch: '申', stars: ['天机', '太阴'] },
  { name: '夫妻', branch: '酉', stars: ['紫微', '贪狼'] },
  { name: '兄弟', branch: '戌', stars: ['巨门'] },
]
const ZIWEI_CHART: ZiWeiChart = {
  solarDate: '1990-05-10',
  lunarDate: '一九九〇年四月十六',
  lunarMonth: 4,
  lunarDay: 16,
  yearGanZhi: '庚午',
  monthGanZhi: '辛巳',
  dayGanZhi: '乙亥',
  timeGanZhi: '壬午',
  timeBranchIndex: 6,
  isLateZi: false,
  naYinBureau: { element: '土', number: 5, name: '土五局' },
  mingGongBranchIndex: 11,
  shenGongBranchIndex: 5,
  palaces: ZIWEI_PALACES_RAW.map((p) => ({
    branchIndex: BRANCH_INDEX[p.branch]!,
    branch: p.branch,
    ganZhi: '戊' + p.branch,
    name: p.name,
    ageRange: '',
    stars: p.stars.map((s) => ({ name: s, type: 'main' as const })),
    isMingGong: p.name === '命宫',
    isShenGong: false,
  })),
  siHua: { '禄': '太阳', '权': '武曲', '科': '太阴', '忌': '天同' },
}

// --- Western fixture (from budi_19900510.json expectedCharts.western) ---
// planetsInHouse gives house numbers; convert to approximate longitudes.
const WEST_HOUSE_TO_LON: Record<number, number> = {}
for (let h = 1; h <= 12; h++) {
  WEST_HOUSE_TO_LON[h] = (h - 1) * 30 + 15
}
const WEST_PLANET_HOUSES: Record<WesternBody, number> = {
  sun: 10, moon: 4, mercury: 9, venus: 8, mars: 7,
  jupiter: 11, saturn: 6, uranus: 5, neptune: 5, pluto: 4,
}
const WESTERN_CHART: WesternChart = {
  jdUT: 2448021.0,
  zodiac: 'tropical',
  houseSystem: 'P',
  polarFallback: false,
  planets: (Object.keys(WEST_PLANET_HOUSES) as WesternBody[]).map(
    (body) => {
      const house = WEST_PLANET_HOUSES[body]
      const lon = WEST_HOUSE_TO_LON[house]!
      return {
        name: body,
        longitudeDeg: lon,
        signIndex: Math.floor(lon / 30) % 12,
        degreeInSign: lon % 30,
        retrograde: false,
      }
    },
  ),
  angles: {
    ascendant: {
      name: 'ascendant',
      longitudeDeg: 135.305,
      signIndex: 4,
      degreeInSign: 15.305,
      retrograde: false,
    },
    midheaven: {
      name: 'midheaven',
      longitudeDeg: 95.0,
      signIndex: 3,
      degreeInSign: 5.0,
      retrograde: false,
    },
  },
  houses: Array.from({ length: 12 }, (_, i) => ({
    index: i + 1,
    longitudeDeg: i * 30,
    signIndex: Math.floor((i * 30) / 30) % 12,
  })),
  aspects: [],
}

// --- Vedic fixture (from budi_19900510.json expectedCharts.vedic) ---
const VEDIC_PLANET_BODIES = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'rahu', 'ketu',
] as const
const VEDIC_PLANET_HOUSES: Record<string, number> = {
  sun: 10, moon: 4, mercury: 9, venus: 8, mars: 7,
  jupiter: 11, saturn: 6, rahu: 6, ketu: 12,
}
const VEDIC_LAGNA_DEG = 111.583
const VEDIC_LAGNA_RASI = Math.floor(VEDIC_LAGNA_DEG / 30) % 12
const RASI_NAMES = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
]
const RASI_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
]
const VEDIC_CHART: VedicChartType = {
  birthDateISO: '1990-05-10',
  birthTimeISO: '12:00',
  tzIANA: 'Asia/Jakarta',
  lat: -6.2,
  lng: 106.8456,
  ayanamsaDeg: 23.85,
  jdUT: 2448021.0,
  lagna: {
    body: 'ascendant',
    longitudeDeg: VEDIC_LAGNA_DEG,
    degInRasi: VEDIC_LAGNA_DEG % 30,
    rasiIndex: VEDIC_LAGNA_RASI as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11,
    rasiName: RASI_NAMES[VEDIC_LAGNA_RASI]!,
    rasiLord: RASI_LORDS[VEDIC_LAGNA_RASI]!,
  },
  moon: {
    body: 'moon',
    longitudeDeg: 4 * 30 + 15,
    degInRasi: 15,
    rasiIndex: 4,
    rasiName: RASI_NAMES[4]!,
    rasiLord: RASI_LORDS[4]!,
    nakshatraIndex: 6,
    nakshatraName: 'Pushya',
    nakshatraLord: 'Saturn',
    pada: 1,
  },
  planets: VEDIC_PLANET_BODIES.map(
    (body) => {
      const house = VEDIC_PLANET_HOUSES[body]
      const rasi = (house - 1) % 12
      const lon = rasi * 30 + 15
      return {
        body: body as VedicBody,
        longitudeDeg: lon,
        degInRasi: 15,
        rasiIndex: rasi as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11,
        rasiName: RASI_NAMES[rasi]!,
        rasiLord: RASI_LORDS[rasi]!,
        retrograde: false,
      }
    },
  ),
  dasha: [],
}

// --- Renderers ---
function renderBazi(): string {
  return renderToStaticMarkup(
    createElement(BaziGrid, { pillars: BAZI_PILLARS, tenGods: BAZI_TENGODS }),
  )
}
function renderZiwei(): string {
  return renderToStaticMarkup(
    createElement(ZiweiPalace, { chart: ZIWEI_CHART }),
  )
}
function renderWestern(): string {
  return renderToStaticMarkup(
    createElement(WesternWheel, { chart: WESTERN_CHART }),
  )
}
function renderVedic(): string {
  return renderToStaticMarkup(
    createElement(VedicChart, { chart: VEDIC_CHART }),
  )
}

const CHARTS = [
  { name: 'bazi', render: renderBazi, dataChart: 'bazi' },
  { name: 'ziwei', render: renderZiwei, dataChart: 'ziwei' },
  { name: 'western', render: renderWestern, dataChart: 'western' },
  { name: 'vedic', render: renderVedic, dataChart: 'vedic' },
] as const

describe('SVG charts (todo 17)', () => {
  it('renders all 4 charts against budi fixture without throwing', () => {
    for (const c of CHARTS) {
      const markup = c.render()
      expect(markup.length).toBeGreaterThan(0)
      expect(markup).toContain('<svg')
    }
  })

  it('each markup contains data-chart and aria-label', () => {
    for (const c of CHARTS) {
      const markup = c.render()
      expect(markup).toContain(`data-chart="${c.dataChart}"`)
      expect(markup).toContain('aria-label=')
    }
  })

  it('determinism: rendering twice yields identical markup', () => {
    for (const c of CHARTS) {
      const a = c.render()
      const b = c.render()
      expect(a).toBe(b)
    }
  })

  it('markup contains no raster image elements and no external URL references', () => {
    // Built via concatenation so the forbidden substrings never appear in source.
    const forbidden = ['<' + 'image', '<' + 'img', 'u' + 'rl(']
    for (const c of CHARTS) {
      const markup = c.render()
      for (const pat of forbidden) {
        expect(markup).not.toContain(pat)
      }
    }
  })

  it('markup contains fill="var(--aka- at least once per chart', () => {
    for (const c of CHARTS) {
      const markup = c.render()
      expect(markup).toContain('fill="var(--aka-')
    }
  })
})
