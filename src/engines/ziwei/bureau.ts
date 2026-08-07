// src/engines/ziwei/bureau.ts — 命/身宫, 五行局, and 12-palace layout.
//
// 命宫 (Life Palace) and 身宫 (Body Palace) are derived from the lunar
// month and time branch via the classic "安命身宫诀":
//   - 寅起正月，顺数至生月，逆数生时为命宫。
//   - 寅起正月，顺数至生月，顺数生时为身宫。
// All indices are 寅-relative (寅=0) internally, then converted to the
// absolute branch index (子=0) for the output.
//
// 五行局 (Five Elements Bureau) is the NaYin element of the 命宫's
// gan-zhi pair, which determines the 紫微 star position.

/** The 12 earthly branches (子=0 .. 亥=11). */
export const BRANCHES: readonly string[] = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
]

/** The 10 heavenly stems (甲=0 .. 癸=9). */
export const STEMS: readonly string[] = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
]

/** 寅's absolute branch index (子=0 convention). */
const YIN = 2

/** Wrap a value into [0, max-1]. */
export function fixIndex(index: number, max = 12): number {
  let r = index % max
  if (r < 0) r += max
  return r
}

/** Convert a 寅-relative index (寅=0) to an absolute branch index (子=0). */
export function relToAbs(rel: number): number {
  return fixIndex(rel + YIN)
}

/** Convert an absolute branch index (子=0) to a 寅-relative index (寅=0). */
export function absToRel(abs: number): number {
  return fixIndex(abs - YIN)
}

/** 五虎遁: the stem of the 寅 palace for a given year stem. */
const TIGER_RULE: Record<string, string> = {
  甲: '丙', 己: '丙',
  乙: '戊', 庚: '戊',
  丙: '庚', 辛: '庚',
  丁: '壬', 壬: '壬',
  戊: '甲', 癸: '甲',
}

/** Palace names in soul-relative order (命宫=0, counterclockwise). */
const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '交友', '事业', '田宅', '福德', '父母',
] as const

/**
 * Compute 命宫 and 身宫 branch indices (absolute, 子=0).
 *
 * @param lunarMonth  Lunar month number (1-12).
 * @param timeBranchIndex  Time branch index (子=0 .. 亥=11).
 * @returns { mingGongBranchIndex, shenGongBranchIndex } absolute indices.
 */
export function computeMingShenGong(
  lunarMonth: number,
  timeBranchIndex: number,
): { mingGongBranchIndex: number; shenGongBranchIndex: number } {
  const monthIndex = fixIndex(lunarMonth - 1) // 寅-relative: month 1 → 寅(0)
  const soulRel = fixIndex(monthIndex - timeBranchIndex) // 逆数生时
  const bodyRel = fixIndex(monthIndex + timeBranchIndex) // 顺数生时
  return {
    mingGongBranchIndex: relToAbs(soulRel),
    shenGongBranchIndex: relToAbs(bodyRel),
  }
}

/** FiveElementsClass entries: [element, number] indexed by bureau index (1-5).
 *  Matches iztro's fiveElementsTable: ['wood3rd','metal4th','water2nd','fire6th','earth5th']. */
const BUREAU_TABLE: ReadonlyArray<readonly [string, number]> = [
  ['木', 3], ['金', 4], ['水', 2], ['火', 6], ['土', 5],
] as const

/**
 * Compute the 五行局 (NaYin bureau) from the 命宫's stem-branch pair.
 *
 * Uses the standard NaYin formula:
 *   stemNumber = floor(stemIdx / 2) + 1
 *   branchNumber = floor((branchIdx mod 6) / 2) + 1
 *   sum = stemNumber + branchNumber; reduce > 5 by subtracting 5
 *   bureau = BUREAU_TABLE[sum - 1]
 */
export function computeBureau(stem: string, branch: string): {
  element: string
  number: number
  name: string
} {
  const stemIdx = STEMS.indexOf(stem)
  const branchIdx = BRANCHES.indexOf(branch)
  const stemNumber = Math.floor(stemIdx / 2) + 1
  const branchNumber = Math.floor((branchIdx % 6) / 2) + 1
  let sum = stemNumber + branchNumber
  while (sum > 5) sum -= 5
  const [element, number] = BUREAU_TABLE[sum - 1]
  const numName = BUREAU_NUMBER_NAME[number]
  return { element, number, name: `${element}${numName}局` }
}

/** Chinese numeral for the bureau number in the name. */
const BUREAU_NUMBER_NAME: Record<number, string> = {
  2: '二', 3: '三', 4: '四', 5: '五', 6: '六',
}

/**
 * Compute the stem of each palace (寅-relative).
 *
 * 五虎遁: the 寅 palace stem is TIGER_RULE[yearStem]; each subsequent
 * palace (顺行) advances one stem.
 */
export function palaceStemAt(relIndex: number, yearStem: string): string {
  const yinStem = TIGER_RULE[yearStem]
  const yinStemIdx = STEMS.indexOf(yinStem)
  return STEMS[fixIndex(yinStemIdx + relIndex, 10)]
}

/**
 * Build the 12-palace layout (names, gan-zhi, age ranges) around the 命宫.
 *
 * Palaces are returned indexed by absolute branch (子=0 .. 亥=11). The
 * 命宫 name sits at the soul (命宫) position; names proceed counterclockwise.
 *
 * @param mingGongBranchIndex  Absolute branch index of 命宫.
 * @param shenGongBranchIndex  Absolute branch index of 身宫.
 * @param yearStem  Year heavenly stem character.
 * @param bureauNumber  Bureau number (2-6) for the 大限 starting age.
 * @returns Array of 12 palace skeletons (stars added later).
 */
export function buildPalaceLayout(
  mingGongBranchIndex: number,
  shenGongBranchIndex: number,
  yearStem: string,
  bureauNumber: number,
): Array<{
  branchIndex: number
  branch: string
  ganZhi: string
  name: string
  ageRange: string
  isMingGong: boolean
  isShenGong: boolean
}> {
  const soulRel = absToRel(mingGongBranchIndex)
  const result: Array<{
    branchIndex: number
    branch: string
    ganZhi: string
    name: string
    ageRange: string
    isMingGong: boolean
    isShenGong: boolean
  }> = []

  for (let absIdx = 0; absIdx < 12; absIdx++) {
    const rel = absToRel(absIdx)
    const branch = BRANCHES[absIdx]
    const stem = palaceStemAt(rel, yearStem)
    const ganZhi = stem + branch
    // Palace name: 命宫 at soulRel, then counterclockwise (rel decreases).
    const nameIdx = fixIndex(soulRel - rel)
    const name = PALACE_NAMES[nameIdx]
    // 大限 age range: starts at bureauNumber, increments by 10 per palace
    // going CLOCKWISE from 命宫 (rel increases).
    const decadeOffset = fixIndex(rel - soulRel)
    const startAge = bureauNumber + decadeOffset * 10
    const endAge = startAge + 9
    const ageRange = `${startAge}-${endAge}`
    result.push({
      branchIndex: absIdx,
      branch,
      ganZhi,
      name,
      ageRange,
      isMingGong: absIdx === mingGongBranchIndex,
      isShenGong: absIdx === shenGongBranchIndex,
    })
  }

  return result
}
