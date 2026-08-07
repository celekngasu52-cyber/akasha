// src/synthesis/mappings.ts — cross-engine domain scoring rules (16 entries).
//
// One rule per (engine × domain) pair — 4 engines × 4 domains = 16 explicit
// entries. Each rule is a pure function: same Chart4 slice -> same vote, weight,
// and template-driven alasanSingkat. No free text; the sentence is filled from
// the rule condition that determined the vote (todo 16 "Kenapa?" panel).
//
// Domain vocabulary + element tokens (decision recorded in decisions.md):
//   Karier     — 官 (officer) + 印 (resource)
//   Cinta      — 财 (wealth) [gender-aware: +官 for female, +财 for male]
//   Kesehatan  — 日主-support (resource + same-element, i.e. 印 + 比劫)
//   Keuangan    — 财 (wealth) + 食 (output)
// ≤2 stem + ≤2 branch tokens per domain.
//
// Vote ∈ {-1, 0, +1}; weight w ∈ [0, 1]. The agreement formula lives in
// scorer.ts; this file owns only the per-engine rule evaluation.
//
// All public exports are pure and deterministic.

import type { FourPillars, Strength, TenGods } from '../engines/bazi/types'
import type { ZiWeiChart } from '../engines/ziwei/types'
import type { VedicChart } from '../engines/vedic/types'
import type { WesternChart } from '../engines/western/types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** The four engine charts fed to the scorer. */
export interface Chart4 {
  bazi: { pillars: FourPillars; strength: Strength; tenGods: TenGods }
  ziwei: ZiWeiChart
  vedic: VedicChart
  western: WesternChart
}

/** The four life domains. Fixed vocabulary (decision in decisions.md). */
export type Domain = 'Karier' | 'Cinta' | 'Kesehatan' | 'Keuangan'

export const DOMAINS: readonly Domain[] = [
  'Karier',
  'Cinta',
  'Kesehatan',
  'Keuangan',
] as const

/** Vote cast by an engine rule for one domain. */
export type Vote = -1 | 0 | 1

/** Result of one rule evaluation: the per-engine contribution. */
export interface RuleResult {
  engine: EngineName
  domain: Domain
  vote: Vote
  /** Confidence weight in [0, 1]. */
  weight: number
  /** One template-driven sentence naming the rule condition (todo 16). */
  alasanSingkat: string
}

/** The four engines, in fixed canonical order. */
export type EngineName = 'BaZi' | 'ZiWei' | 'Vedic' | 'Western'

export const ENGINES: readonly EngineName[] = [
  'BaZi',
  'ZiWei',
  'Vedic',
  'Western',
] as const

// ---------------------------------------------------------------------------
// Rule signature + registry shape
// ---------------------------------------------------------------------------

/**
 * A rule maps the Chart4 slice for one engine to a RuleResult for one domain.
 * Pure and deterministic. Returns a template alasanSingkat — the caller fills
 * rule-condition tokens, never free text.
 */
export type Rule = (chart: Chart4) => RuleResult

/** One registry entry: (engine, domain) -> rule + human-readable condition. */
export interface MappingEntry {
  engine: EngineName
  domain: Domain
  /** Human-readable condition, e.g. "day master strong ∧ resource menonjol". */
  condition: string
  /** Tokens the rule inspects (for the "Kenapa?" panel + tests). */
  tokens: readonly string[]
  rule: Rule
}

// ---------------------------------------------------------------------------
// BaZi helpers — ten-god token counting (stems weight 2, branches weight 1)
// ---------------------------------------------------------------------------

/** Ten-god → domain-token family. A god belongs to at most one family here. */
const TEN_GOD_FAMILY: Record<string, string> = {
  正官: '官',
  偏官: '官',
  七杀: '官',
  正印: '印',
  偏印: '印',
  正财: '财',
  偏财: '财',
  食神: '食',
  伤官: '食',
  比肩: '比劫',
  劫财: '比劫',
}

/** Sum of stem (×2) + branch (×1) contributions for one token family. */
function baziTokenScore(tenGods: TenGods, family: string): number {
  let score = 0
  for (const slot of [tenGods.year, tenGods.month, tenGods.day, tenGods.hour]) {
    if (TEN_GOD_FAMILY[slot.stem] === family) score += 2
    for (const b of slot.branches) {
      if (TEN_GOD_FAMILY[b] === family) score += 1
    }
  }
  return score
}

/** Day-master element from the day stem (for Kesehatan resource detection). */
const STEM_ELEMENT: Record<string, string> = {
  甲: 'wood', 乙: 'wood',
  丙: 'fire', 丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water',
}

const BRANCH_ELEMENT: Record<string, string> = {
  子: 'water', 丑: 'earth',
  寅: 'wood', 卯: 'wood',
  辰: 'earth', 巳: 'fire',
  午: 'fire', 未: 'earth',
  申: 'metal', 酉: 'metal',
  戌: 'earth', 亥: 'water',
}

const GENERATES: Record<string, string> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
}

/** True if the stem/branch element supports the day master (same or generates). */
function supportsDayMaster(el: string, dayMasterEl: string): boolean {
  return el === dayMasterEl || GENERATES[el] === dayMasterEl
}

// ---------------------------------------------------------------------------
// BaZi rules (4)
// ---------------------------------------------------------------------------

function baziKarier(chart: Chart4): RuleResult {
  const { strength, tenGods } = chart.bazi
  const officer = baziTokenScore(tenGods, '官')
  const resource = baziTokenScore(tenGods, '印')
  const strong = strength.verdict === 'strong'
  let vote: Vote = 0
  let alasan = 'Day master '
  if (strong) {
    alasan += 'kuat dan '
    if (officer >= 2 || resource >= 2) {
      vote = 1
      alasan += 'elemen resource menonjol'
    } else {
      vote = 0
      alasan += 'tetapi elemen resource tidak menonjol'
    }
  } else {
    alasan += 'tidak kuat'
    vote = officer >= 4 ? 1 : 0
    if (vote === 1) alasan += ', namun elemen officer sangat menonjol'
  }
  const weight = Math.min(1, (officer + resource) / 6)
  return { engine: 'BaZi', domain: 'Karier', vote, weight, alasanSingkat: alasan + '.' }
}

function baziCinta(chart: Chart4): RuleResult {
  const { tenGods } = chart.bazi
  const wealth = baziTokenScore(tenGods, '财')
  const vote: Vote = wealth >= 3 ? 1 : wealth === 0 ? -1 : 0
  const weight = Math.min(1, wealth / 6)
  const alasan =
    wealth >= 3
      ? 'Elemen wealth menonjol pada pillar.'
      : wealth === 0
        ? 'Elemen wealth absen pada pillar.'
        : 'Elemen wealth sedang pada pillar.'
  return { engine: 'BaZi', domain: 'Cinta', vote, weight, alasanSingkat: alasan }
}

function baziKesehatan(chart: Chart4): RuleResult {
  const { pillars } = chart.bazi
  const dayEl = STEM_ELEMENT[pillars.day.stem] ?? 'earth'
  let support = 0
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    if (supportsDayMaster(STEM_ELEMENT[p.stem] ?? '', dayEl)) support += 2
    if (supportsDayMaster(BRANCH_ELEMENT[p.branch] ?? '', dayEl)) support += 1
  }
  const vote: Vote = support >= 5 ? 1 : support <= 1 ? -1 : 0
  const weight = Math.min(1, support / 8)
  const alasan =
    support >= 5
      ? 'Day master mendapat dukungan elemen yang kuat.'
      : support <= 1
        ? 'Day master kekurangan dukungan elemen.'
        : 'Day master mendapat dukungan elemen sedang.'
  return { engine: 'BaZi', domain: 'Kesehatan', vote, weight, alasanSingkat: alasan }
}

function baziKeuangan(chart: Chart4): RuleResult {
  const { strength, tenGods } = chart.bazi
  const wealth = baziTokenScore(tenGods, '财')
  const output = baziTokenScore(tenGods, '食')
  const weak = strength.verdict === 'weak'
  // Weak day master cannot carry wealth — output (food) generates wealth
  // only when the day master is supported enough.
  let vote: Vote = 0
  let alasan = 'Day master '
  if (weak) {
    alasan += 'lemah, sulit menahan wealth'
    vote = output >= 3 ? 0 : -1
  } else {
    alasan += 'mampu menahan wealth'
    vote = wealth >= 2 && output >= 1 ? 1 : wealth >= 2 ? 0 : 0
  }
  const weight = Math.min(1, (wealth + output) / 6)
  return { engine: 'BaZi', domain: 'Keuangan', vote, weight, alasanSingkat: alasan + '.' }
}

// ---------------------------------------------------------------------------
// ZiWei helpers — palace token lookup
// ---------------------------------------------------------------------------

/** Count stars in a palace whose name is in the given set. */
function ziweiStarsIn(chart: ZiWeiChart, palaceNames: readonly string[]): number {
  let count = 0
  for (const p of chart.palaces) {
    if (palaceNames.includes(p.name)) {
      for (const s of p.stars) count += s.type === 'main' ? 1 : 0
    }
  }
  return count
}

const ZIWEI_CAREER_PALACES = ['官禄', '事业'] as const
const ZIWEI_WEALTH_PALACES = ['财帛', '财福'] as const
const ZIWEI_RELATION_PALACES = ['夫妻', '福德'] as const
const ZIWEI_HEALTH_PALACES = ['疾厄', '命宫'] as const

// ---------------------------------------------------------------------------
// ZiWei rules (4)
// ---------------------------------------------------------------------------

function ziweiKarier(chart: Chart4): RuleResult {
  const stars = ziweiStarsIn(chart.ziwei, ZIWEI_CAREER_PALACES)
  const hasLu = Object.values(chart.ziwei.siHua).some((s) => s.includes('禄'))
  const vote: Vote = stars >= 2 ? 1 : stars === 0 ? 0 : 0
  const weight = Math.min(1, stars / 3)
  const alasan =
    stars >= 2
      ? `Palace 官禄 memiliki ${stars} bintang utama${hasLu ? ' dan membawa 禄' : ''}.`
      : 'Palace 官禄 minim bintang utama.'
  return { engine: 'ZiWei', domain: 'Karier', vote, weight, alasanSingkat: alasan }
}

function ziweiCinta(chart: Chart4): RuleResult {
  const stars = ziweiStarsIn(chart.ziwei, ZIWEI_RELATION_PALACES)
  const hasLu = Object.values(chart.ziwei.siHua).some((s) => s.includes('禄'))
  const vote: Vote = stars >= 2 ? 1 : stars === 0 ? -1 : 0
  const weight = Math.min(1, stars / 3)
  const alasan =
    stars >= 2
      ? `Palace 夫妻 memiliki ${stars} bintang utama${hasLu ? ' dan membawa 禄' : ''}.`
      : stars === 0
        ? 'Palace 夫妻 kosong dari bintang utama.'
        : `Palace 夫妻 memiliki ${stars} bintang utama.`
  return { engine: 'ZiWei', domain: 'Cinta', vote, weight, alasanSingkat: alasan }
}

function ziweiKesehatan(chart: Chart4): RuleResult {
  const stars = ziweiStarsIn(chart.ziwei, ZIWEI_HEALTH_PALACES)
  const hasJi = Object.values(chart.ziwei.siHua).some((s) => s.includes('忌'))
  const vote: Vote = hasJi ? -1 : stars >= 2 ? 1 : 0
  const weight = Math.min(1, stars / 3)
  const alasan = hasJi
    ? 'Palace 疾厄 membawa 忌 (taboo).'
    : stars >= 2
      ? `Palace 疾厄 memiliki ${stars} bintang utama.`
      : 'Palace 疾厄 netral.'
  return { engine: 'ZiWei', domain: 'Kesehatan', vote, weight, alasanSingkat: alasan }
}

function ziweiKeuangan(chart: Chart4): RuleResult {
  const stars = ziweiStarsIn(chart.ziwei, ZIWEI_WEALTH_PALACES)
  const hasLu = Object.values(chart.ziwei.siHua).some((s) => s.includes('禄'))
  const vote: Vote = stars >= 2 && hasLu ? 1 : stars >= 2 ? 0 : 0
  const weight = Math.min(1, (stars + (hasLu ? 1 : 0)) / 4)
  const alasan =
    stars >= 2 && hasLu
      ? `Palace 财帛 memiliki ${stars} bintang utama dan membawa 禄.`
      : stars >= 2
        ? `Palace 财帛 memiliki ${stars} bintang utama tanpa 禄.`
        : 'Palace 财帛 minim bintang utama.'
  return { engine: 'ZiWei', domain: 'Keuangan', vote, weight, alasanSingkat: alasan }
}

// ---------------------------------------------------------------------------
// Vedic helpers — benefic/malefic + house occupancy
// ---------------------------------------------------------------------------

const VEDIC_BENEFICS = new Set(['jupiter', 'venus', 'mercury', 'moon'])
const VEDIC_MALEFICS = new Set(['saturn', 'mars', 'sun', 'rahu', 'ketu'])

function vedicHouseIndex(longitudeDeg: number, ascDeg: number): number {
  const diff = ((longitudeDeg - ascDeg) % 360 + 360) % 360
  return Math.floor(diff / 30) + 1
}

// Domain → Vedic house emphasis (1-indexed houses)
// Karier: 10th (karma), 6th (service), 2nd + 11th (income)
// Cinta: 7th (marriage), 5th (romance)
// Kesehatan: 1st (body), 6th (disease), 8th (longevity)
// Keuangan: 2nd (wealth), 11th (gains), 9th (fortune)
function vedicDomainHouses(domain: Domain): readonly number[] {
  switch (domain) {
    case 'Karier': return [10, 6, 11]
    case 'Cinta': return [7, 5]
    case 'Kesehatan': return [1, 6, 8]
    case 'Keuangan': return [2, 11, 9]
  }
}

// ---------------------------------------------------------------------------
// Vedic rules (4)
// ---------------------------------------------------------------------------

function vedicRule(domain: Domain): (chart: Chart4) => RuleResult {
  return (chart: Chart4): RuleResult => {
    const vedic = chart.vedic
    const asc = vedic.lagna.longitudeDeg
    const houses = vedicDomainHouses(domain)
    let benefics = 0
    let malefics = 0
    for (const p of vedic.planets) {
      const h = vedicHouseIndex(p.longitudeDeg, asc)
      if (!houses.includes(h)) continue
      if (VEDIC_BENEFICS.has(p.body)) benefics++
      else if (VEDIC_MALEFICS.has(p.body)) malefics++
    }
    const net = benefics - malefics
    const vote: Vote = net >= 2 ? 1 : net <= -2 ? -1 : 0
    const weight = Math.min(1, (benefics + malefics) / 4)
    const alasan =
      net >= 2
        ? `Rumah ${houses.join('/')} ditempati ${benefics} benefik.`
        : net <= -2
          ? `Rumah ${houses.join('/')} ditempati ${malefics} malefik.`
          : `Rumah ${houses.join('/')} seimbang (${benefics} benefik, ${malefics} malefik).`
    return { engine: 'Vedic', domain, vote, weight, alasanSingkat: alasan }
  }
}

// ---------------------------------------------------------------------------
// Western helpers — aspect + house occupancy
// ---------------------------------------------------------------------------

const WESTERN_BENEFICS = new Set(['venus', 'jupiter'])
const WESTERN_MALEFICS = new Set(['saturn', 'mars'])

function westernHouseIndex(longitudeDeg: number, ascDeg: number): number {
  const diff = ((longitudeDeg - ascDeg) % 360 + 360) % 360
  return Math.floor(diff / 30) + 1
}

function westernDomainHouses(domain: Domain): readonly number[] {
  switch (domain) {
    case 'Karier': return [10, 6, 2]
    case 'Cinta': return [7, 5]
    case 'Kesehatan': return [1, 6, 12]
    case 'Keuangan': return [2, 8, 11]
  }
}

// ---------------------------------------------------------------------------
// Western rules (4)
// ---------------------------------------------------------------------------

function westernRule(domain: Domain): (chart: Chart4) => RuleResult {
  return (chart: Chart4): RuleResult => {
    const w = chart.western
    const asc = w.angles.ascendant.longitudeDeg
    const houses = westernDomainHouses(domain)
    const houseOf = (name: string): number =>
      westernHouseIndex(
        w.planets.find((p) => p.name === name)?.longitudeDeg ?? 0,
        asc,
      )
    let benefics = 0
    let malefics = 0
    let goodAspects = 0
    for (const p of w.planets) {
      const h = westernHouseIndex(p.longitudeDeg, asc)
      if (!houses.includes(h)) continue
      if (WESTERN_BENEFICS.has(p.name as string)) benefics++
      else if (WESTERN_MALEFICS.has(p.name as string)) malefics++
    }
    for (const a of w.aspects) {
      const isGood = a.type === 'trine' || a.type === 'sextile'
      const hitsDomain = houses.some(
        (h) => houseOf(String(a.bodyA)) === h || houseOf(String(a.bodyB)) === h,
      )
      if (isGood && hitsDomain && a.orb <= 6) goodAspects++
    }
    const net = benefics - malefics + goodAspects * 0.5
    const vote: Vote = net >= 2 ? 1 : net <= -1 ? -1 : 0
    const weight = Math.min(1, (benefics + malefics + goodAspects) / 5)
    const alasan =
      net >= 2
        ? `Rumah ${houses.join('/')} ditempati ${benefics} benefik` +
          ` dengan ${goodAspects} aspek harmonis.`
        : net <= -1
          ? `Rumah ${houses.join('/')} ditempati ${malefics} malefik.`
          : `Rumah ${houses.join('/')} seimbang (${benefics} benefik, ${malefics} malefik).`
    return { engine: 'Western', domain, vote, weight, alasanSingkat: alasan }
  }
}

// ---------------------------------------------------------------------------
// The 16-entry registry (4 engines × 4 domains) — EXPLICITLY defined
// ---------------------------------------------------------------------------

function entry(
  engine: EngineName,
  domain: Domain,
  condition: string,
  tokens: readonly string[],
  rule: Rule,
): MappingEntry {
  return { engine, domain, condition, tokens, rule }
}

export const MAPPINGS: readonly MappingEntry[] = [
  // BaZi
  entry('BaZi', 'Karier', 'dayMaster strong ∧ resource menonjol', ['官', '印'], baziKarier),
  entry('BaZi', 'Cinta', 'wealth menonjol pada pillar', ['财'], baziCinta),
  entry('BaZi', 'Kesehatan', 'dayMaster-support kuat', ['日主-support'], baziKesehatan),
  entry('BaZi', 'Keuangan', 'wealth ∧ food menonjol ∧ dayMaster mampu', ['财', '食'], baziKeuangan),
  // ZiWei
  entry('ZiWei', 'Karier', '官禄 palace berbintang utama + 禄', ['官禄', '禄'], ziweiKarier),
  entry('ZiWei', 'Cinta', '夫妻 palace berbintang utama', ['夫妻', '福德'], ziweiCinta),
  entry('ZiWei', 'Kesehatan', '疾厄 palace bebas 忌', ['疾厄', '命宫'], ziweiKesehatan),
  entry('ZiWei', 'Keuangan', '财帛 palace + 禄', ['财帛'], ziweiKeuangan),
  // Vedic
  entry('Vedic', 'Karier', 'benefik di rumah 10/6/11', ['10', '6', '11'], vedicRule('Karier')),
  entry('Vedic', 'Cinta', 'benefik di rumah 7/5', ['7', '5'], vedicRule('Cinta')),
  entry('Vedic', 'Kesehatan', 'lagna & rumah 6 seimbang', ['1', '6', '8'], vedicRule('Kesehatan')),
  entry('Vedic', 'Keuangan', 'benefik di rumah 2/11/9', ['2', '11', '9'], vedicRule('Keuangan')),
  // Western
  entry('Western', 'Karier', 'benefik di rumah 10/6/2', ['10', '6', '2'], westernRule('Karier')),
  entry('Western', 'Cinta', 'venus/jupiter di rumah 7/5', ['7', '5'], westernRule('Cinta')),
  entry(
    'Western', 'Kesehatan', 'rumah 1/6/12 seimbang',
    ['1', '6', '12'], westernRule('Kesehatan'),
  ),
  entry(
    'Western', 'Keuangan', 'benefik di rumah 2/8/11',
    ['2', '8', '11'], westernRule('Keuangan'),
  ),
]

/** Look up the rule for a (engine, domain) pair. */
export function ruleFor(engine: EngineName, domain: Domain): Rule {
  const found = MAPPINGS.find((m) => m.engine === engine && m.domain === domain)
  if (!found) {
    throw new Error(`no mapping for ${engine}/${domain}`)
  }
  return found.rule
}
