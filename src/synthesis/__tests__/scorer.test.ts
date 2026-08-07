// src/synthesis/__tests__/scorer.test.ts — scorer + mappings contract tests (todo 11).
//
// Three acceptance groups:
//   (a) Synthetic formula cases — unanimous +1/w=1 -> 100; split -1,+1,-1,+1 -> 0.
//       Also asserts label boundaries (70 Tinggi, 69 Sedang, 40 Sedang, 39 Rendah).
//   (b) Fixed non-degenerate persona budi_19900510 — real engine computation,
//       hand-computed expected Karier score hardcoded (no self-reference).
//   (c) Per-engine detail — alasanSingkat of a rule that determined a vote
//       contains at least 1 token from that rule's condition.

import { describe, expect, it } from 'vitest'
import type { BirthData } from '../../core/birth/types'
import { computeFourPillars, computeStrength, computeTenGods } from '../../engines/bazi'
import { computeZiWeiChart } from '../../engines/ziwei'
import { computeVedicChart } from '../../engines/vedic'
import { computeNatalChart as computeWesternChart } from '../../engines/western'
import type { Chart4 } from '../mappings'
import { MAPPINGS } from '../mappings'
import { agreement, labelFor, scoreAll, scoreDomain } from '../scorer'
import type { EngineDetail } from '../scorer'

// --- helpers ---------------------------------------------------------------

function makeDetail(
  engine: EngineDetail['engine'],
  vote: EngineDetail['vote'],
  weight: number,
): EngineDetail {
  return {
    engine,
    domain: 'Karier',
    vote,
    weight,
    alasanSingkat: 'x',
  }
}

// ===========================================================================
// (a) Synthetic formula cases
// ===========================================================================

describe('scorer — agreement formula (synthetic)', () => {
  it('unanimous +1 with all w=1 yields score exactly 100', () => {
    const details: EngineDetail[] = [
      makeDetail('BaZi', 1, 1),
      makeDetail('ZiWei', 1, 1),
      makeDetail('Vedic', 1, 1),
      makeDetail('Western', 1, 1),
    ]
    expect(agreement(details)).toBe(100)
  })

  it('split votes -1,+1,-1,+1 with w=1 yields score exactly 0', () => {
    const details: EngineDetail[] = [
      makeDetail('BaZi', -1, 1),
      makeDetail('ZiWei', 1, 1),
      makeDetail('Vedic', -1, 1),
      makeDetail('Western', 1, 1),
    ]
    // variance of [-1,+1,-1,+1] = mean 0, sum of squares = 4, /4 = 1
    // agreement = 100 * (1 - 1) * 1 = 0
    expect(agreement(details)).toBe(0)
  })

  it('all-abstain (every vote 0) yields score 0 — no signal', () => {
    const details: EngineDetail[] = [
      makeDetail('BaZi', 0, 1),
      makeDetail('ZiWei', 0, 1),
      makeDetail('Vedic', 0, 1),
      makeDetail('Western', 0, 1),
    ]
    expect(agreement(details)).toBe(0)
  })

  it('label boundary: 70 -> Tinggi, 69 -> Sedang, 40 -> Sedang, 39 -> Rendah', () => {
    expect(labelFor(70)).toBe('Tinggi')
    expect(labelFor(69)).toBe('Sedang')
    expect(labelFor(40)).toBe('Sedang')
    expect(labelFor(39)).toBe('Rendah')
  })
})

// ===========================================================================
// (b) Fixed non-degenerate persona: budi_19900510
// ===========================================================================
//
// Birth data (synthetic, inline — fixture formalization is todo 13):
//   dateISO 1990-05-10, timeISO 12:00, lat -6.2088, lng 106.8456,
//   tzIANA Asia/Jakarta.
//
// HAND COMPUTATION of the Karier agreement score (all 4 engines):
//
// Engine field values (printed by scratch-budi.ts, run against the real
// committed engines — no mocks):
//
//   BaZi:  pillars year=庚午 month=辛巳 day=乙亥 hour=壬午
//          strength.verdict = "weak" (score -2)
//          tenGods: year.stem=正官  month.stem=七杀  day.stem=日主  hour.stem=正印
//                   year.branches=[食神,偏财] month.branches=[伤官,正官,正财]
//                   day.branches=[正印,劫财] hour.branches=[食神,偏财]
//
//   ZiWei: siHua = {禄:太阳, 权:武曲, 科:太阴, 忌:天同}
//          palaces: 命宫(亥)=天相, 父母(子)=天梁, 福德(丑)=廉贞+七杀,
//                   交友(辰)=天同, 迁移(巳)=武曲+破军, 疾厄(午)=太阳,
//                   财帛(未)=天府, 子女(申)=天机+太阴, 夫妻(酉)=紫微+贪狼,
//                   兄弟(戌)=巨门.  (No 官禄/事业 palace present.)
//
//   Vedic: lagna deg=111.583; planets:
//          sun h=10, moon h=4, mercury h=9, venus h=8, mars h=7,
//          jupiter h=11, saturn h=6, rahu h=6, ketu h=12.
//
//   Western: asc deg=135.305; planets:
//          sun h=10, moon h=4, mercury h=9, venus h=8, mars h=7,
//          jupiter h=11, saturn h=6, uranus h=5, neptune h=5, pluto h=4.
//          aspects (trine/sextile with orb<=6 hitting a Karier house):
//            sun-mars sextile orb=4.89 (sun in h10)   -> goodAspects
//            sun-neptune trine orb=4.86 (sun in h10)  -> goodAspects
//            moon-saturn sextile orb=1.72 (saturn h6) -> goodAspects
//            saturn-midheaven trine orb=3.31 (saturn h6) -> goodAspects
//
// --- Rule evaluation (mappings.ts) ---
//
// BaZi->Karier (baziKarier):
//   strong = (verdict==="strong") = false  -> else-branch
//   officer = baziTokenScore('官'): 正官(yr stem,×2)=2, 七杀(mo stem,×2)=2,
//            正官(mo branch,×1)=1  => officer=5
//   vote = officer>=4 ? 1 : 0  -> 5>=4 -> +1
//   resource = baziTokenScore('印'): 正印(hr stem,×2)=2, 正印(day branch,×1)=1 => 3
//   weight = min(1,(officer+resource)/6) = min(1,8/6)=1
//   => BaZi: vote=+1, w=1
//
// ZiWei->Karier (ziweiKarier):
//   stars = ziweiStarsIn(['官禄','事业']) = 0  (no such palace in budi's chart)
//   vote = stars>=2?1 : stars===0?0 : 0  -> 0
//   weight = min(1, 0/3) = 0
//   => ZiWei: vote=0, w=0
//
// Vedic->Karier (vedicRule('Karier'), houses=[10,6,11]):
//   benefics in {10,6,11}: jupiter(h11) -> 1
//   malefics in {10,6,11}: sun(h10), saturn(h6), rahu(h6) -> 3
//   net = 1-3 = -2; vote = net<=-2?-1:0 -> -1
//   weight = min(1,(1+3)/4) = 1
//   => Vedic: vote=-1, w=1
//
// Western->Karier (westernRule('Karier'), houses=[10,6,2]):
//   benefics in {10,6,2}: none -> 0
//   malefics in {10,6,2}: saturn(h6) -> 1
//   goodAspects = 4 (see list above; all trine/sextile, orb<=6, hit a Karier house)
//   net = 0-1+4*0.5 = 1; vote = net>=2?1:net<=-1?-1:0 -> 0
//   weight = min(1,(0+1+4)/5) = 1
//   => Western: vote=0, w=1
//
// --- Agreement (scorer.ts agreement fn) ---
//
//   details = [BaZi(+1,w1), ZiWei(0,w0), Vedic(-1,w1), Western(0,w1)]
//   signalVotes = [+1, -1]  (engines with vote≠0)
//   allWeights  = [1,0,1,1]  (mean over ALL engines)
//   meanWeight  = (1+0+1+1)/4 = 0.75
//   variance    = populationVariance([+1,-1]) = mean 0, sq=(1+1)=2, /2 = 1
//   raw = 100 * (1 - 1) * 0.75 = 0
//   clamp[0,100] -> 0
//
// EXPECTED budi Karier agreement = 0  (label: Rendah)
// This is NOT 50 — it is a genuine non-degenerate disagreement: BaZi votes +1,
// Vedic votes -1, variance=1 cancels the agreement term entirely.

const BUDI_KARIER_EXPECTED = 0

const budi: BirthData = {
  dateISO: '1990-05-10',
  timeISO: '12:00',
  lat: -6.2088,
  lng: 106.8456,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  isTimeEstimated: false,
}

async function buildBudiChart4(): Promise<Chart4> {
  const pillars = computeFourPillars(budi)
  const strength = computeStrength(pillars)
  const tenGods = computeTenGods(budi)
  const ziwei = computeZiWeiChart(budi, 1)
  const vedic = await computeVedicChart(budi)
  const western = await computeWesternChart(budi)
  return { bazi: { pillars, strength, tenGods }, ziwei, vedic, western }
}

describe('scorer — budi_19900510 Karier (hand-computed, no self-reference)', () => {
  it('Karier agreement equals the hand-computed 0 (BaZi +1 vs Vedic -1 cancel)', async () => {
    const chart = await buildBudiChart4()
    const karier = scoreDomain(chart, 'Karier')
    // The expected value is derived by hand above, not by calling the scorer.
    expect(karier.agreement).toBe(BUDI_KARIER_EXPECTED)
    expect(karier.label).toBe('Rendah')
  })

  it('budi Karier per-engine votes match the hand-computed values', async () => {
    const chart = await buildBudiChart4()
    const karier = scoreDomain(chart, 'Karier')
    const byEngine = new Map(karier.details.map((d) => [d.engine, d]))
    expect(byEngine.get('BaZi')?.vote).toBe(1)
    expect(byEngine.get('BaZi')?.weight).toBe(1)
    expect(byEngine.get('ZiWei')?.vote).toBe(0)
    expect(byEngine.get('ZiWei')?.weight).toBe(0)
    expect(byEngine.get('Vedic')?.vote).toBe(-1)
    expect(byEngine.get('Vedic')?.weight).toBe(1)
    expect(byEngine.get('Western')?.vote).toBe(0)
    expect(byEngine.get('Western')?.weight).toBe(1)
  })

  it('scoreAll returns all 4 domains with 4 engine details each', async () => {
    const chart = await buildBudiChart4()
    const all = scoreAll(chart)
    expect(Object.keys(all)).toHaveLength(4)
    for (const domain of ['Karier', 'Cinta', 'Kesehatan', 'Keuangan'] as const) {
      expect(all[domain].details).toHaveLength(4)
      expect(all[domain].details.every((d) => d.alasanSingkat.length > 0)).toBe(true)
    }
  })
})

// ===========================================================================
// (c) alasanSingkat contains a condition token from the rule
// ===========================================================================

describe('scorer — alasanSingkat carries rule-condition tokens', () => {
  it('BaZi Karier alasanSingkat contains "resource" or "officer" (the condition)', async () => {
    const chart = await buildBudiChart4()
    const karier = scoreDomain(chart, 'Karier')
    const bazi = karier.details.find((d) => d.engine === 'BaZi')!
    // baziKarier condition inspects officer/resource tokens; the fired
    // vote branch appends "elemen officer" or "elemen resource" to alasan.
    expect(
      /officer|resource/i.test(bazi.alasanSingkat),
    ).toBe(true)
  })

  it('Vedic Karier alasanSingkat contains "rumah" (house-condition token)', async () => {
    const chart = await buildBudiChart4()
    const karier = scoreDomain(chart, 'Karier')
    const vedic = karier.details.find((d) => d.engine === 'Vedic')!
    // vedicRule alasan always starts with "Rumah" — the house-occupancy
    // condition that determined the vote.
    expect(vedic.alasanSingkat.toLowerCase()).toContain('rumah')
  })

  it('every mapping entry has a non-empty condition and >=1 token', () => {
    // The registry is explicitly defined — no silent defaults.
    expect(MAPPINGS).toHaveLength(16)
    for (const m of MAPPINGS) {
      expect(m.condition.length).toBeGreaterThan(0)
      expect(m.tokens.length).toBeGreaterThanOrEqual(1)
    }
  })
})
