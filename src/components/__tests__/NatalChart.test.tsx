// src/components/__tests__/NatalChart.test.tsx
//
// Render tests for NatalChart + LuckCycle via react-dom/server static markup
// (no jsdom, matching the InputPage/Dashboard/Report test pattern). Verifies:
//   1. All 4 pillar labels (Tahun/Bulan/Hari/Jam) render.
//   2. Each pillar's full gan-zhi string appears verbatim (no splitting).
//   3. The exact phrase "Kekuatan Hari Utama" is present.
//   4. The exact phrase "Sepuluh Dewa" is present.
//   5. Each pillar's stem ten-god renders.
//   6. LuckCycle renders "Masa Kecil" (pre-大運) and an age range.

// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { NatalChart } from '../NatalChart'
import { LuckCycle } from '../LuckCycle'
import type {
  FourPillars,
  Strength,
  TenGods,
  LuckPillar,
} from '../../engines/bazi'

const pillars: FourPillars = {
  year: { ganZhi: '庚午', stem: '庚', branch: '午' },
  month: { ganZhi: '壬子', stem: '壬', branch: '子' },
  day: { ganZhi: '甲寅', stem: '甲', branch: '寅' },
  hour: { ganZhi: '丙申', stem: '丙', branch: '申' },
}

const tenGods: TenGods = {
  year: { stem: '偏財', branches: ['正官', '劫財'] },
  month: { stem: '偏印', branches: ['比肩'] },
  day: { stem: '比肩', branches: ['食神', '偏財'] },
  hour: { stem: '食神', branches: ['偏官'] },
}

const strength: Strength = { score: 2, verdict: 'strong' }

const luck: readonly LuckPillar[] = [
  { ganZhi: '', startAge: 1, endAge: 8, startYear: 1990, endYear: 1997 },
  { ganZhi: '辛未', startAge: 9, endAge: 18, startYear: 1998, endYear: 2007 },
  { ganZhi: '壬申', startAge: 19, endAge: 28, startYear: 2008, endYear: 2017 },
]

function renderNatal(): string {
  return renderToStaticMarkup(
    createElement(NatalChart, { pillars, tenGods, strength }),
  )
}

function renderLuck(age?: number): string {
  return renderToStaticMarkup(
    createElement(LuckCycle, { luck, currentAge: age }),
  )
}

describe('NatalChart', () => {
  const html = renderNatal()

  it('renders all 4 pillar labels', () => {
    expect(html).toContain('Tahun')
    expect(html).toContain('Bulan')
    expect(html).toContain('Hari')
    expect(html).toContain('Jam')
  })

  /** Strip HTML tags to check the rendered TEXT content (for gan-zhi). */
  function stripTags(s: string): string {
    return s.replace(/<[^>]+>/g, '')
  }

  it('contains each pillar full gan-zhi string verbatim (text)', () => {
    const text = stripTags(html)
    expect(text).toContain('庚午')
    expect(text).toContain('壬子')
    expect(text).toContain('甲寅')
    expect(text).toContain('丙申')
  })

  it('contains the exact phrase "Kekuatan Hari Utama"', () => {
    expect(html).toContain('Kekuatan Hari Utama')
  })

  it('contains the verdict label and signed score', () => {
    expect(html).toContain('Kuat')
    expect(html).toContain('(skor +2)')
  })

  it('contains the exact phrase "Sepuluh Dewa"', () => {
    expect(html).toContain('Sepuluh Dewa')
  })

  it('renders each pillar stem ten-god', () => {
    expect(html).toContain('偏財')
    expect(html).toContain('偏印')
    expect(html).toContain('比肩')
    expect(html).toContain('食神')
  })

  it('renders the strongest/weakest element line', () => {
    expect(html).toContain('Unsur terkuat')
    expect(html).toContain('Terlemah')
  })

  it('renders the Hari Utama highlight chip', () => {
    expect(html).toContain('Hari Utama')
  })
})

describe('LuckCycle', () => {
  const html = renderLuck()

  it('renders "Masa Kecil" for the pre-大運 pillar', () => {
    expect(html).toContain('Masa Kecil')
  })

  it('renders an age range with an en dash', () => {
    expect(html).toContain('9–18')
    expect(html).toContain('19–28')
  })

  it('renders the end year in mono', () => {
    expect(html).toContain('2007')
    expect(html).toContain('2017')
  })

  it('renders each decade gan-zhi', () => {
    expect(html).toContain('辛未')
    expect(html).toContain('壬申')
  })

  it('highlights the current-age pill when provided', () => {
    const h23 = renderLuck(23)
    // The 19–28 pillar should carry the accent border color
    expect(h23).toContain('var(--aka-accent)')
  })
})
