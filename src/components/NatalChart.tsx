// src/components/NatalChart.tsx — four-pillar (四柱) natal BaZi panel.
//
// Mirrors paid BaZi reading sites: a 4-column grid (Tahun/Bulan/Hari/Jam) with
// each pillar's stem + branch characters colored by their five element, the
// stem's ten-god above and the branch's hidden ten-gods below. The Hari (day)
// pillar is highlighted as "Hari Utama". Below: day-master strength summary,
// strongest/weakest element line (喜用神 signal), and ElementBars.
//
// All colors use var(--aka-*) tokens via inline styles (except the documented
// water hex from bazi-elements). No Tailwind color utilities, no gradients.

import type { FourPillars, Strength, StrengthVerdict, TenGods } from '../engines/bazi'
import type { PillarTenGods } from '../engines/bazi'
import {
  ELEMENT_COLOR,
  ELEMENT_GLYPH,
  ELEMENT_LABEL_ID,
  elementOfStem,
  elementOfBranch,
  elementTally,
  strongestElement,
  weakestElement,
} from '../lib/bazi-elements'
import { ElementBars } from './ElementBars'

interface NatalChartProps {
  pillars: FourPillars
  tenGods: TenGods
  strength: Strength
  showBars?: boolean
}

/** Pillar slot labels in Indonesian (Tahun/Bulan/Hari/Jam). */
const PILLAR_LABELS: readonly string[] = ['Tahun', 'Bulan', 'Hari', 'Jam']

/** Pillar slots in FourPillars order. */
const PILLAR_SLOTS = ['year', 'month', 'day', 'hour'] as const

/** Indonesian verdict label for day-master strength. */
function verdictLabel(v: StrengthVerdict): string {
  if (v === 'strong') return 'Kuat'
  if (v === 'weak') return 'Lemah'
  return 'Seimbang'
}

/** Signed score with explicit + sign (e.g. +2, -1, 0). */
function signedScore(n: number): string {
  if (n > 0) return `+${n}`
  return `${n}`
}

/**
 * Render one pillar column: stem ten-god, stem+branch chars (contiguous,
 * each colored by element), branch hidden ten-gods.
 */
function PillarColumn({
  pillar,
  tenGods,
  isDay,
}: {
  pillar: FourPillars['year']
  tenGods: PillarTenGods
  isDay: boolean
}): React.ReactNode {
  const stemEl = elementOfStem(pillar.stem)
  const branchEl = elementOfBranch(pillar.branch)
  return (
    <div
      className="flex flex-col items-center gap-1 border-2 p-2"
      style={{
        borderColor: isDay ? 'var(--aka-accent)' : 'var(--aka-border)',
        backgroundColor: isDay ? 'var(--aka-accent-soft)' : 'transparent',
      }}
    >
      {/* Stem ten-god (small, muted) */}
      <span
        className="font-mono text-[10px] uppercase tracking-wide"
        style={{ color: 'var(--aka-muted)' }}
      >
        {tenGods.stem}
      </span>
      {/* Stem + branch contiguous (no space between them) */}
      <span className="font-display text-2xl">
        <span style={{ color: ELEMENT_COLOR[stemEl] }}>{pillar.stem}</span>
        <span style={{ color: ELEMENT_COLOR[branchEl] }}>{pillar.branch}</span>
      </span>
      {/* Branch hidden ten-gods (small, muted, joined with ·) */}
      <span
        className="font-mono text-[10px]"
        style={{ color: 'var(--aka-muted)' }}
      >
        {tenGods.branches.join(' · ')}
      </span>
    </div>
  )
}

export function NatalChart({
  pillars,
  tenGods,
  strength,
  showBars = true,
}: NatalChartProps): React.ReactNode {
  const tally = elementTally(pillars)
  const strongest = strongestElement(tally)
  const weakest = weakestElement(tally)
  const dayStemEl = elementOfStem(pillars.day.stem)

  return (
    <div className="flex flex-col gap-3">
      {/* Sepuluh Dewa (十神) label */}
      <h4
        className="font-mono text-xs uppercase tracking-wide"
        style={{ color: 'var(--aka-muted)' }}
      >
        Sepuluh Dewa (十神)
      </h4>

      {/* Hari Utama chip above the day column row */}
      <div className="grid grid-cols-4 gap-2">
        <div />
        <div />
        <div className="flex justify-center">
          <span
            className="border-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
            style={{
              borderColor: 'var(--aka-accent)',
              color: 'var(--aka-accent)',
            }}
          >
            Hari Utama
          </span>
        </div>
        <div />
      </div>

      {/* 4-column pillar grid */}
      <div className="grid grid-cols-4 gap-2">
        {PILLAR_SLOTS.map((slot, i) => (
          <div key={slot} className="flex flex-col items-center gap-1">
            <span
              className="font-mono text-xs uppercase tracking-wide"
              style={{ color: 'var(--aka-fg)' }}
            >
              {PILLAR_LABELS[i]}
            </span>
            <PillarColumn
              pillar={pillars[slot]}
              tenGods={tenGods[slot]}
              isDay={slot === 'day'}
            />
          </div>
        ))}
      </div>

      {/* Day-master strength summary */}
      <p
        className="font-body text-sm"
        style={{ color: 'var(--aka-fg)' }}
      >
        Kekuatan Hari Utama: {verdictLabel(strength.verdict)}{' '}
        (skor {signedScore(strength.score)}).
        {' '}
        Unsur Hari Utama:{' '}
        <span style={{ color: ELEMENT_COLOR[dayStemEl] }}>
          {ELEMENT_GLYPH[dayStemEl]} {ELEMENT_LABEL_ID[dayStemEl]}
        </span>
        .
      </p>

      {/* Strongest / weakest element line (喜用神 signal) */}
      <p
        className="font-body text-sm"
        style={{ color: 'var(--aka-fg)' }}
      >
        Unsur terkuat:{' '}
        <span style={{ color: ELEMENT_COLOR[strongest] }}>
          {ELEMENT_LABEL_ID[strongest]}
        </span>
        {' · '}
        Terlemah:{' '}
        <span style={{ color: ELEMENT_COLOR[weakest] }}>
          {ELEMENT_LABEL_ID[weakest]}
        </span>
        .
      </p>

      {/* Five-element balance bars */}
      {showBars && <ElementBars tally={tally} />}
    </div>
  )
}
