// src/engines/ziwei/stars.ts — 14 primary stars, auxiliary stars, and 四化.
//
// Star placement replicates the iztro (MIT) algorithm, which implements
// the standard 安星诀 (star placement formulas) of Zi Wei Dou Shu.
// All indices are 寅-relative (寅=0) internally; conversion to absolute
// branch index happens at the palace level.
//
// 紫微系 (counterclockwise from 紫微): 紫微→天机→(skip)→太阳→武曲→
//   天同→(skip)→(skip)→廉贞
// 天府系 (clockwise from 天府): 天府→太阴→贪狼→巨门→天相→天梁→
//   七杀→(skip×3)→破军

import { fixIndex, STEMS, BRANCHES } from './bureau'
import type { PalaceStar, SiHua, SiHuaFlag } from './types'

/** Bureau number → element, used by getZiweiTianfuIndex. */
const BUREAU_NUMBER: Record<string, number> = {
  '水': 2, '木': 3, '金': 4, '土': 5, '火': 6,
}

/**
 * Compute 紫微 and 天府 star positions (寅-relative indices).
 *
 * 起紫微星诀: divide lunar day by bureau number, find the smallest
 * divisor where the remainder is 0, then position based on the quotient
 * and loop count.
 */
export function getZiweiTianfuIndex(lunarDay: number, bureauNumber: number): {
  ziweiIndex: number
  tianfuIndex: number
} {
  let offset = -1
  let quotient: number
  let remainder = -1
  do {
    offset++
    const divisor = lunarDay + offset
    quotient = Math.floor(divisor / bureauNumber)
    remainder = divisor % bureauNumber
  } while (remainder !== 0)

  quotient %= 12
  let ziweiIndex = quotient - 1
  if (offset % 2 === 0) {
    ziweiIndex += offset
  } else {
    ziweiIndex -= offset
  }
  ziweiIndex = fixIndex(ziweiIndex)
  const tianfuIndex = fixIndex(12 - ziweiIndex)
  return { ziweiIndex, tianfuIndex }
}

/** 紫微系 stars and their offsets from 紫微 (counterclockwise). */
const ZIWEI_GROUP: ReadonlyArray<readonly [string, number]> = [
  ['紫微', 0], ['天机', 1], ['太阳', 3], ['武曲', 4],
  ['天同', 5], ['廉贞', 8],
] as const

/** 天府系 stars and their offsets from 天府 (clockwise). */
const TIANFU_GROUP: ReadonlyArray<readonly [string, number]> = [
  ['天府', 0], ['太阴', 1], ['贪狼', 2], ['巨门', 3],
  ['天相', 4], ['天梁', 5], ['七杀', 6], ['破军', 10],
] as const

/** All 14 primary star names. */
export const PRIMARY_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
  '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
] as const

/** 四化 table per year stem: [禄, 权, 科, 忌]. */
const SIHUA_TABLE: Record<string, ReadonlyArray<string>> = {
  甲: ['廉贞', '破军', '武曲', '太阳'],
  乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'],
  丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'],
  己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'],
  辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'],
  癸: ['破军', '巨门', '太阴', '贪狼'],
}

const SIHUA_FLAGS: ReadonlyArray<SiHuaFlag> = ['禄', '权', '科', '忌']

/** Compute the 四化 mapping for a year stem. */
export function computeSiHua(yearStem: string): SiHua {
  const [lu, quan, ke, ji] = SIHUA_TABLE[yearStem]
  return { 禄: lu, 权: quan, 科: ke, 忌: ji }
}

/** Build a map: starName → 四化 flag, for a given year stem. */
export function siHuaFlagMap(yearStem: string): Map<string, SiHuaFlag> {
  const stars = SIHUA_TABLE[yearStem]
  const m = new Map<string, SiHuaFlag>()
  stars.forEach((star, i) => m.set(star, SIHUA_FLAGS[i]))
  return m
}

/**
 * Place the 14 primary stars into a 寅-relative palace array.
 * Returns a 12-element array of PalaceStar[] (寅=0).
 */
export function placePrimaryStars(
  ziweiIndex: number,
  tianfuIndex: number,
  siHuaMap: Map<string, SiHuaFlag>,
): PalaceStar[][] {
  const palaces: PalaceStar[][] = Array.from({ length: 12 }, () => [])
  for (const [name, offset] of ZIWEI_GROUP) {
    const idx = fixIndex(ziweiIndex - offset) // 逆行 (counterclockwise)
    palaces[idx].push(makeStar(name, 'main', siHuaMap))
  }
  for (const [name, offset] of TIANFU_GROUP) {
    const idx = fixIndex(tianfuIndex + offset) // 顺行 (clockwise)
    palaces[idx].push(makeStar(name, 'main', siHuaMap))
  }
  return palaces
}

// --- Auxiliary stars ---

/** 禄存 position (寅-relative) per year stem.
 *  甲禄到寅(0), 乙禄居卯(1), 丙戊禄在巳(3), 丁己禄在午(4),
 *  庚禄定居申(6), 辛禄酉上补(7), 壬禄亥中藏(9), 癸禄居子户(10). */
const LUCUN_TABLE: Record<string, number> = {
  甲: 0, 乙: 1, 丙: 3, 丁: 4, 戊: 3, 己: 4, 庚: 6, 辛: 7, 壬: 9, 癸: 10,
}

/** 天魁/天钺 positions (寅-relative) per year stem.
 *  甲戊庚 → 丑未(rel 11,5); 乙己 → 子申(rel 10,6); 辛 → 午寅(rel 4,0);
 *  壬癸 → 卯巳(rel 1,3); 丙丁 → 亥酉(rel 9,7). */
const KUIYUE_TABLE: Record<string, readonly [number, number]> = {
  甲: [11, 5], 戊: [11, 5], 庚: [11, 5],
  乙: [10, 6], 己: [10, 6],
  辛: [4, 0],
  壬: [1, 3], 癸: [1, 3],
  丙: [9, 7], 丁: [9, 7],
}

/** 火星/铃星 starting positions (寅-relative) per year-branch group.
 *  fixEarthlyBranchIndex(branch) = (absIdx - 2) mod 12. */
const HUOLING_START: Record<string, readonly [number, number]> = {
  申: [0, 8], 子: [0, 8], 辰: [0, 8],   // 寅, 戌 (rel)
  寅: [11, 1], 午: [11, 1], 戌: [11, 1], // 丑, 卯 (rel)
  巳: [1, 8], 酉: [1, 8], 丑: [1, 8],   // 卯, 戌 (rel)
  亥: [7, 8], 卯: [7, 8], 未: [7, 8],   // 酉, 戌 (rel)
}

/**
 * Place auxiliary stars into a 寅-relative palace array.
 * Returns a 12-element array of PalaceStar[] (寅=0).
 */
export function placeAuxStars(
  yearStem: string,
  yearBranch: string,
  lunarMonth: number,
  timeBranchIndex: number,
  siHuaMap: Map<string, SiHuaFlag>,
): PalaceStar[][] {
  const palaces: PalaceStar[][] = Array.from({ length: 12 }, () => [])

  // 左辅/右弼: 辰上顺数月, 戌上逆数月 (寅-relative)
  const chenRel = fixIndex(4 - 2) // 辰 abs=4 → rel=2
  const xuRel = fixIndex(10 - 2) // 戌 abs=10 → rel=8
  const zuoIdx = fixIndex(chenRel + (lunarMonth - 1))
  const youIdx = fixIndex(xuRel - (lunarMonth - 1))
  palaces[zuoIdx].push(makeStar('左辅', 'aux', siHuaMap))
  palaces[youIdx].push(makeStar('右弼', 'aux', siHuaMap))

  // 文昌/文曲: 辰上顺数时, 戌上逆数时 (寅-relative, timeIndex=timeBranchIndex)
  const changIdx = fixIndex(xuRel - timeBranchIndex)
  const quIdx = fixIndex(chenRel + timeBranchIndex)
  palaces[changIdx].push(makeStar('文昌', 'aux', siHuaMap))
  palaces[quIdx].push(makeStar('文曲', 'aux', siHuaMap))

  // 天魁/天钺 (by year stem)
  const [kuiRel, yueRel] = KUIYUE_TABLE[yearStem]
  palaces[kuiRel].push(makeStar('天魁', 'aux', siHuaMap))
  palaces[yueRel].push(makeStar('天钺', 'aux', siHuaMap))

  // 禄存/擎羊/陀罗 (by year stem)
  const luRel = LUCUN_TABLE[yearStem]
  palaces[luRel].push(makeStar('禄存', 'aux', siHuaMap))
  palaces[fixIndex(luRel + 1)].push(makeStar('擎羊', 'aux', siHuaMap))
  palaces[fixIndex(luRel - 1)].push(makeStar('陀罗', 'aux', siHuaMap))

  // 火星/铃星 (by year branch + time branch)
  const [huoStart, lingStart] = HUOLING_START[yearBranch]
  palaces[fixIndex(huoStart + timeBranchIndex)].push(makeStar('火星', 'aux', siHuaMap))
  palaces[fixIndex(lingStart + timeBranchIndex)].push(makeStar('铃星', 'aux', siHuaMap))

  // 地空/地劫 (by time branch): 亥逆数时→地空, 亥顺数时→地劫
  const haiRel = fixIndex(11 - 2) // 亥 abs=11 → rel=9
  palaces[fixIndex(haiRel - timeBranchIndex)].push(makeStar('地空', 'aux', siHuaMap))
  palaces[fixIndex(haiRel + timeBranchIndex)].push(makeStar('地劫', 'aux', siHuaMap))

  return palaces
}

/** Create a PalaceStar with optional 四化 flag. */
function makeStar(
  name: string, type: 'main' | 'aux', siHuaMap: Map<string, SiHuaFlag>,
): PalaceStar {
  const flag = siHuaMap.get(name)
  return flag ? { name, type, siHua: flag } : { name, type }
}

/** Convert a 寅-relative palace array to absolute-branch-indexed (子=0). */
export function relToAbsPalaces(relPalaces: PalaceStar[][]): PalaceStar[][] {
  const abs: PalaceStar[][] = Array.from({ length: 12 }, () => [])
  for (let rel = 0; rel < 12; rel++) {
    const absIdx = fixIndex(rel + 2) // 寅=0 → abs=2
    abs[absIdx] = relPalaces[rel]
  }
  return abs
}

/** Re-export for chart.ts convenience. */
export { BUREAU_NUMBER, STEMS, BRANCHES }
