// src/lib/__tests__/bazi-elements.test.ts
//
// Pure-logic tests for the five-element helpers. No React, no jsdom — uses the
// node vitest environment. Verifies: stem/branch→element mapping for all 10
// stems + 12 branches, tally weighting (stems 2, branches 1), elementShare
// sums to 1, strongest/weakest resolution.

// @vitest-environment node

import { describe, it, expect } from 'vitest'
import {
  FIVE_ELEMENTS,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  elementOfStem,
  elementOfBranch,
  elementTally,
  elementShare,
  strongestElement,
  weakestElement,
  type ElementTally,
} from '../bazi-elements'
import type { FourPillars } from '../../engines/bazi'

describe('FIVE_ELEMENTS', () => {
  it('is in canonical generation order', () => {
    expect(FIVE_ELEMENTS).toEqual([
      'wood', 'fire', 'earth', 'metal', 'water',
    ])
  })
})

describe('elementOfStem', () => {
  it('maps all 10 heavenly stems correctly', () => {
    expect(elementOfStem('甲')).toBe('wood')
    expect(elementOfStem('乙')).toBe('wood')
    expect(elementOfStem('丙')).toBe('fire')
    expect(elementOfStem('丁')).toBe('fire')
    expect(elementOfStem('戊')).toBe('earth')
    expect(elementOfStem('己')).toBe('earth')
    expect(elementOfStem('庚')).toBe('metal')
    expect(elementOfStem('辛')).toBe('metal')
    expect(elementOfStem('壬')).toBe('water')
    expect(elementOfStem('癸')).toBe('water')
  })

  it('falls back to earth for unknown chars', () => {
    expect(elementOfStem('?')).toBe('earth')
    expect(elementOfStem('')).toBe('earth')
  })

  it('agrees with STEM_ELEMENT map for all 10 stems', () => {
    for (const stem of Object.keys(STEM_ELEMENT)) {
      expect(elementOfStem(stem)).toBe(STEM_ELEMENT[stem])
    }
  })
})

describe('elementOfBranch', () => {
  it('maps all 12 earthly branches correctly', () => {
    expect(elementOfBranch('子')).toBe('water')
    expect(elementOfBranch('丑')).toBe('earth')
    expect(elementOfBranch('寅')).toBe('wood')
    expect(elementOfBranch('卯')).toBe('wood')
    expect(elementOfBranch('辰')).toBe('earth')
    expect(elementOfBranch('巳')).toBe('fire')
    expect(elementOfBranch('午')).toBe('fire')
    expect(elementOfBranch('未')).toBe('earth')
    expect(elementOfBranch('申')).toBe('metal')
    expect(elementOfBranch('酉')).toBe('metal')
    expect(elementOfBranch('戌')).toBe('earth')
    expect(elementOfBranch('亥')).toBe('water')
  })

  it('falls back to earth for unknown chars', () => {
    expect(elementOfBranch('?')).toBe('earth')
    expect(elementOfBranch('')).toBe('earth')
  })

  it('agrees with BRANCH_ELEMENT map for all 12 branches', () => {
    for (const br of Object.keys(BRANCH_ELEMENT)) {
      expect(elementOfBranch(br)).toBe(BRANCH_ELEMENT[br])
    }
  })
})

describe('elementTally', () => {
  // Known pillar set: 庚午 / 壬子 / 甲寅 / 丙申
  // stems: 庚(metal) 壬(water) 甲(wood) 丙(fire) — each weight 2
  // branches: 午(fire) 子(water) 寅(wood) 申(metal) — each weight 1
  // Expected: wood=3, fire=3, earth=0, metal=3, water=3
  const pillars: FourPillars = {
    year: { ganZhi: '庚午', stem: '庚', branch: '午' },
    month: { ganZhi: '壬子', stem: '壬', branch: '子' },
    day: { ganZhi: '甲寅', stem: '甲', branch: '寅' },
    hour: { ganZhi: '丙申', stem: '丙', branch: '申' },
  }

  it('weighs stems 2 and branches 1', () => {
    const tally = elementTally(pillars)
    expect(tally).toEqual({
      wood: 3, fire: 3, earth: 0, metal: 3, water: 3,
    })
  })

  it('produces total weight 12 (4 stems × 2 + 4 branches × 1)', () => {
    const tally = elementTally(pillars)
    const total =
      tally.wood + tally.fire + tally.earth + tally.metal + tally.water
    expect(total).toBe(12)
  })
})

describe('elementShare', () => {
  const tally: ElementTally = {
    wood: 4, fire: 2, earth: 0, metal: 2, water: 4,
  }

  it('returns the fraction of the total for each element', () => {
    const total = 12
    expect(elementShare(tally, 'wood')).toBeCloseTo(4 / total)
    expect(elementShare(tally, 'fire')).toBeCloseTo(2 / total)
    expect(elementShare(tally, 'earth')).toBeCloseTo(0)
    expect(elementShare(tally, 'metal')).toBeCloseTo(2 / total)
    expect(elementShare(tally, 'water')).toBeCloseTo(4 / total)
  })

  it('shares sum to 1', () => {
    const sum = FIVE_ELEMENTS.reduce(
      (acc, el) => acc + elementShare(tally, el),
      0,
    )
    expect(sum).toBeCloseTo(1)
  })

  it('returns 0.2 for all elements when total is 0', () => {
    const empty: ElementTally = {
      wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
    }
    for (const el of FIVE_ELEMENTS) {
      expect(elementShare(empty, el)).toBe(0.2)
    }
  })
})

describe('strongestElement / weakestElement', () => {
  const tally: ElementTally = {
    wood: 5, fire: 1, earth: 0, metal: 1, water: 5,
  }

  it('returns the highest-share element', () => {
    // wood and water tie at 5; wood comes first in FIVE_ELEMENTS order
    expect(strongestElement(tally)).toBe('wood')
  })

  it('returns the lowest-share element', () => {
    expect(weakestElement(tally)).toBe('earth')
  })

  it('breaks ties by FIVE_ELEMENTS order (wood first)', () => {
    const tied: ElementTally = {
      wood: 1, fire: 1, earth: 1, metal: 1, water: 1,
    }
    expect(strongestElement(tied)).toBe('wood')
    expect(weakestElement(tied)).toBe('wood')
  })

  it('handles all-zero tally without error', () => {
    const empty: ElementTally = {
      wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
    }
    // all shares are 0.2 → tie → wood first
    expect(strongestElement(empty)).toBe('wood')
    expect(weakestElement(empty)).toBe('wood')
  })
})
