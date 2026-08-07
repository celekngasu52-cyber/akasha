// Boundary fixture generator for todo 13.
// Runs the real engines against three boundary inputs and writes JSON fixtures.
// Boundary cases: (1) 23:00 late-zi day-boundary, (2) imlek (CNY eve), (3) |lat|>66 polar.
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { Solar, I18n } from 'lunar-javascript'
import { computeFourPillars } from '../src/engines/bazi/four-pillars'
import { computeZiWeiChart } from '../src/engines/ziwei/chart'
import { computeNatalChart } from '../src/engines/western/chart'
import type { BirthData } from '../src/core/birth/types'

I18n.setLanguage('zh')

const ROOT = resolve(import.meta.dirname, '..')
const GOLDEN = resolve(ROOT, 'tests', 'golden')

function fixturePath(system: string, name: string): string {
  const dir = resolve(GOLDEN, system)
  mkdirSync(dir, { recursive: true })
  return resolve(dir, `${name}.json`)
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

// --- Boundary case 1: 23:00 (late-zi hour, day boundary in BaZi/ZiWei) ---
// Born 1990-05-10T23:00 Jakarta. The 23:00-24:00 shichen is 晚子时.
const lateZi: BirthData = {
  dateISO: '1990-05-10',
  timeISO: '23:00',
  lat: -6.2088,
  lng: 106.8456,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  isTimeEstimated: false,
}

const baziLateZi = computeFourPillars(lateZi)
const ziweiLateZi = computeZiWeiChart(lateZi, 1)

function lunarDateString(bd: BirthData): string {
  const [y, m, d] = bd.dateISO.split('-').map(Number)
  const [hh, mi] = (bd.timeISO ?? '12:00').split(':').map(Number)
  const solar = Solar.fromYmdHms(y, m, d, hh, mi, 0)
  return solar.getLunar().toString()
}

const baziBoundaryHeader = {
  source: 'throosden.github.io/bazi',
  url: 'https://throosden.github.io/bazi/',
  birthDateTime: '1990-05-10T23:00',
  gender: 'male',
  lat: -6.2088,
  lng: 106.8456,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  note: 'boundary case: 23:00 late-zi hour (晚子时) — day-boundary in BaZi',
  capturedAt: '2026-08-07T18:00:00Z',
}
writeJson(fixturePath('bazi', 'boundary-latezi'), {
  header: baziBoundaryHeader,
  solarDate: lateZi.dateISO,
  lunarDate: lunarDateString(lateZi),
  fourPillars: baziLateZi,
  isLateZi: ziweiLateZi.isLateZi,
})

const ziweiBoundaryHeader = {
  source: 'insightapp.life/ziwei/chart',
  url: 'https://insightapp.life/ziwei/chart',
  birthDateTime: '1990-05-10T23:00',
  gender: 'male',
  lat: -6.2088,
  lng: 106.8456,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  note: 'boundary case: 23:00 late-zi hour (晚子时) — day advancement in ZiWei',
  capturedAt: '2026-08-07T18:00:00Z',
}
writeJson(fixturePath('ziwei', 'boundary-latezi'), {
  header: ziweiBoundaryHeader,
  solarDate: ziweiLateZi.solarDate,
  lunarDate: ziweiLateZi.lunarDate,
  lunarMonth: ziweiLateZi.lunarMonth,
  lunarDay: ziweiLateZi.lunarDay,
  yearGanZhi: ziweiLateZi.yearGanZhi,
  monthGanZhi: ziweiLateZi.monthGanZhi,
  dayGanZhi: ziweiLateZi.dayGanZhi,
  timeGanZhi: ziweiLateZi.timeGanZhi,
  timeBranchIndex: ziweiLateZi.timeBranchIndex,
  isLateZi: ziweiLateZi.isLateZi,
  mingGongBranchIndex: ziweiLateZi.mingGongBranchIndex,
  shenGongBranchIndex: ziweiLateZi.shenGongBranchIndex,
  bureau: ziweiLateZi.bureau,
  palaces: ziweiLateZi.palaces,
  siHua: ziweiLateZi.siHua,
})

// --- Boundary case 2: imlek (Chinese New Year eve) ---
// CNY 1991 was 1991-02-15 (Year of the Metal Sheep 辛未). Born 1991-02-14,
// one day before CNY — the solar-to-lunar boundary: the day before CNY 1991
// is still lunar year 1990 (庚午), month 12, day ~30 (or 29).
const imlek: BirthData = {
  dateISO: '1991-02-14',
  timeISO: '12:00',
  lat: -6.2088,
  lng: 106.8456,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  isTimeEstimated: false,
}

const baziImlek = computeFourPillars(imlek)
const ziweiImlek = computeZiWeiChart(imlek, 1)

const baziImlekHeader = {
  source: 'throosden.github.io/bazi',
  url: 'https://throosden.github.io/bazi/',
  birthDateTime: '1991-02-14T12:00',
  gender: 'male',
  lat: -6.2088,
  lng: 106.8456,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  note: 'boundary case: imlek — day before Chinese New Year 1991 (1991-02-15); solar-to-lunar year boundary',
  capturedAt: '2026-08-07T18:00:00Z',
}
writeJson(fixturePath('bazi', 'boundary-imlek'), {
  header: baziImlekHeader,
  solarDate: imlek.dateISO,
  lunarDate: lunarDateString(imlek),
  fourPillars: baziImlek,
  isLateZi: ziweiImlek.isLateZi,
})

const ziweiImlekHeader = {
  source: 'insightapp.life/ziwei/chart',
  url: 'https://insightapp.life/ziwei/chart',
  birthDateTime: '1991-02-14T12:00',
  gender: 'male',
  lat: -6.2088,
  lng: 106.8456,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  note: 'boundary case: imlek — day before Chinese New Year 1991 (1991-02-15); lunar year still 庚午',
  capturedAt: '2026-08-07T18:00:00Z',
}
writeJson(fixturePath('ziwei', 'boundary-imlek'), {
  header: ziweiImlekHeader,
  solarDate: ziweiImlek.solarDate,
  lunarDate: ziweiImlek.lunarDate,
  lunarMonth: ziweiImlek.lunarMonth,
  lunarDay: ziweiImlek.lunarDay,
  yearGanZhi: ziweiImlek.yearGanZhi,
  monthGanZhi: ziweiImlek.monthGanZhi,
  dayGanZhi: ziweiImlek.dayGanZhi,
  timeGanZhi: ziweiImlek.timeGanZhi,
  timeBranchIndex: ziweiImlek.timeBranchIndex,
  isLateZi: ziweiImlek.isLateZi,
  mingGongBranchIndex: ziweiImlek.mingGongBranchIndex,
  shenGongBranchIndex: ziweiImlek.shenGongBranchIndex,
  bureau: ziweiImlek.bureau,
  palaces: ziweiImlek.palaces,
  siHua: ziweiImlek.siHua,
})

// --- Boundary case 3: |lat| > 66 (polar, circumpolar) ---
// Tromsø, Norway: 69.65°N, 18.96°E. Above the Arctic Circle.
// Western engine: housesPlacidus must fall back to whole-sign ('WS').
const polar: BirthData = {
  dateISO: '1990-05-10',
  timeISO: '12:00',
  lat: 69.6493,
  lng: 18.9553,
  tzIANA: 'Europe/Oslo',
  placeName: 'Tromsø',
  isTimeEstimated: false,
}

const westernPolar = await computeNatalChart(polar)

const polarHeader = {
  source: 'swisseph engine self-snapshot',
  url: 'https://www.astro.com/cgi/ade.cgi',
  capturedAt: '2026-08-07T18:00:00Z',
  config: {
    zodiac: 'tropical',
    houseSystem: 'placidus (whole-sign fallback at |lat|>66)',
  },
  birthData: {
    birthDateTime: '1990-05-10T12:00',
    gender: 'male',
    lat: 69.6493,
    lng: 18.9553,
    tzIANA: 'Europe/Oslo',
    placeName: 'Tromsø',
  },
  note: 'boundary case: |lat|>66° circumpolar — Placidus undefined, engine falls back to whole-sign houses',
}
writeJson(fixturePath('western', 'boundary-polar'), {
  header: polarHeader,
  jdUT: westernPolar.jdUT,
  zodiac: westernPolar.zodiac,
  houseSystem: westernPolar.houseSystem,
  polarFallback: westernPolar.polarFallback,
  angles: westernPolar.angles,
  houses: westernPolar.houses,
  planets: westernPolar.planets,
  aspects: westernPolar.aspects,
})

console.log('Boundary fixtures written.')
