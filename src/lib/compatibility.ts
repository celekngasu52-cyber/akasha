// src/lib/compatibility.ts — two-person compatibility ("Jodoh") synthesis.
//
// The headline score is grounded in REAL BaZi data: the 5-element relation
// between the two day masters (生/克 cycle) and the day-branch 六合/冲
// interaction. Per-domain scores are then synthesized deterministically from a
// seed of the two birth signatures — synthesis, not a 4-engine verdict.
//
// Everything is pure: same (A, B) always yields the same result, and no birth
// data leaves the browser.

import { computeFourPillars } from '../engines/bazi'
import { DOMAIN_NAMES } from '../synthesis/narrative'
import type { BirthData } from '../core/birth'

type FiveElement = '木' | '火' | '土' | '金' | '水'

const STEM_ELEMENT: Readonly<Record<string, FiveElement>> = Object.freeze({
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金',
  辛: '金', 壬: '水', 癸: '水',
})

const ELEMENT_NAME: Readonly<Record<FiveElement, string>> = Object.freeze({
  木: 'Kayu', 火: 'Api', 土: 'Tanah', 金: 'Logam', 水: 'Air',
})

/** Wood generates Fire, Fire Earth, Earth Metal, Metal Water, Water Wood. */
const GENERATES: Readonly<Record<FiveElement, FiveElement>> = Object.freeze({
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
})

/** Wood controls Earth, Earth Water, Water Fire, Fire Metal, Metal Wood. */
const CONTROLS: Readonly<Record<FiveElement, FiveElement>> = Object.freeze({
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
})

const BRANCHES: readonly string[] = Object.freeze([
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
])

/** 六合 (combining) branch pairs — harmony. */
const COMBINE_PAIRS: Readonly<Record<number, number>> = Object.freeze({
  0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6,
})

/** 六冲 (clashing) branch pairs — tension. */
const CLASH_PAIRS: Readonly<Record<number, number>> = Object.freeze({
  0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5,
})

export type RelationTone =
  | 'same'
  | 'generates'
  | 'generated'
  | 'controls'
  | 'controlled'

export type Tone = 'harmonis' | 'netral' | 'menantang'

export interface CompatibilityDomain {
  readonly domain: string
  readonly score: number
  readonly label: 'Tinggi' | 'Sedang' | 'Rendah'
}

export interface CompatibilityResult {
  /** Overall 0-100 score. */
  readonly overall: number
  readonly tone: Tone
  /** Day-master element of each person. */
  readonly elementA: FiveElement
  readonly elementB: FiveElement
  /** Element relation of A vs B. */
  readonly relation: RelationTone
  /** Human-readable 生克 relation sentence. */
  readonly relationNote: string
  /** 六合 / 冲 day-branch note, or '' when neither. */
  readonly branchNote: string
  readonly tlDr: string
  /** Per-domain synthesis scores in DOMAIN_NAMES order. */
  readonly domains: readonly CompatibilityDomain[]
  /** Stable identity of the pair (order-insensitive). */
  readonly key: string
}

/** Map a BaZi heavenly stem to its five element. */
export function elementOfStem(stem: string): FiveElement {
  const e = STEM_ELEMENT[stem]
  if (!e) throw new RangeError(`BaZi stem tidak dikenal: ${stem}`)
  return e
}

function dayStem(data: BirthData): string {
  return computeFourPillars(data).day.stem
}

function dayBranch(data: BirthData): string {
  return computeFourPillars(data).day.branch
}

function branchIndexOf(branch: string): number {
  return BRANCHES.indexOf(branch)
}

/** FNV-1a 32-bit — stable across runs and platforms. */
function hashSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n))
}

function labelFor(score: number): 'Tinggi' | 'Sedang' | 'Rendah' {
  if (score >= 70) return 'Tinggi'
  if (score >= 40) return 'Sedang'
  return 'Rendah'
}

/** Relation of A's element to B's element along the 生/克 cycle. */
function relationOf(a: FiveElement, b: FiveElement): RelationTone {
  if (a === b) return 'same'
  if (GENERATES[a] === b) return 'generates'
  if (CONTROLS[a] === b) return 'controls'
  if (GENERATES[b] === a) return 'generated'
  return 'controlled'
}

/** Base compatibility score from the 生克 relation, before adjustments. */
function baseScore(relation: RelationTone): number {
  switch (relation) {
    case 'generates':
      return 78
    case 'generated':
      return 74
    case 'same':
      return 60
    case 'controls':
    case 'controlled':
      return 45
  }
}

/** Day-branch interplay: 六合 (+12), 六冲 (-12), else neutral. */
function branchAdjustment(a: BirthData, b: BirthData): number {
  const ia = branchIndexOf(dayBranch(a))
  const ib = branchIndexOf(dayBranch(b))
  if (ia === -1 || ib === -1) return 0
  if (COMBINE_PAIRS[ia] === ib) return 12
  if (CLASH_PAIRS[ia] === ib) return -12
  return 0
}

function branchNoteFor(adj: number): string {
  if (adj >= 12) return 'cabang hari berpadu (六合) — menambah kehangatan'
  if (adj <= -12) return 'cabang hari bentrok (六冲) — butuh komunikasi ekstra'
  return ''
}

function relationNoteFor(
  relation: RelationTone,
  elA: FiveElement,
  elB: FiveElement,
): string {
  const a = ELEMENT_NAME[elA]
  const b = ELEMENT_NAME[elB]
  switch (relation) {
    case 'same':
      return `${a} seunsur dengan ${b}`
    case 'generates':
      return `${a} mendukung ${b} (相生)`
    case 'generated':
      return `${b} mendukung ${a} (相生)`
    case 'controls':
      return `${a} mengontrol ${b} (相克)`
    case 'controlled':
      return `${b} mengontrol ${a} (相克)`
  }
}

function toneOf(score: number): Tone {
  if (score >= 70) return 'harmonis'
  if (score >= 45) return 'netral'
  return 'menantang'
}

/** Stable, order-insensitive identity for a pair of birth signatures. */
export function compatibilityKey(a: BirthData, b: BirthData): string {
  const keyA = `${a.dateISO}|${a.timeISO ?? ''}|${a.lat}|${a.lng}`
  const keyB = `${b.dateISO}|${b.timeISO ?? ''}|${b.lat}|${b.lng}`
  return [keyA, keyB].sort().join('<>')
}

/** Compute the full compatibility verdict for two people. Pure. */
export function computeCompatibility(
  a: BirthData,
  b: BirthData,
): CompatibilityResult {
  const elA = elementOfStem(dayStem(a))
  const elB = elementOfStem(dayStem(b))
  const relation = relationOf(elA, elB)

  const key = compatibilityKey(a, b)
  const adj = branchAdjustment(a, b)
  const jitter = (hashSeed(`compat|${key}`) % 7) - 3 // deterministic ±3
  const overall = clamp(baseScore(relation) + adj + jitter)
  const tone = toneOf(overall)

  const domains: CompatibilityDomain[] = DOMAIN_NAMES.map((domain) => {
    const delta = (hashSeed(`compat|${key}|${domain}`) % 15) - 8
    const score = clamp(overall + delta)
    return { domain, score, label: labelFor(score) }
  })

  const relationNote = relationNoteFor(relation, elA, elB)
  const branchNote = branchNoteFor(adj)
  const tlDr =
    `Kompatibilitas ${tone} — ${relationNote}${branchNote ? `, ${branchNote}` : ''}. ` +
    `Skor keseluruhan ${overall}/100.`

  return {
    overall,
    tone,
    elementA: elA,
    elementB: elB,
    relation,
    relationNote,
    branchNote,
    tlDr,
    domains,
    key,
  }
}