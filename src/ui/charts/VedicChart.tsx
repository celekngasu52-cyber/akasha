// src/ui/charts/VedicChart.tsx — South-Indian style rasi chart.
//
// South-Indian chart layout: a 4x4 square grid where the 12 rasi (signs) occupy
// fixed perimeter positions (center 2x2 is empty). Sign order is fixed and
// clockwise: Pisces(11) at top-left, Aries(0) next, ..., Aquarius(10) at
// left-middle. Planets are placed in the cell of the sign (rasi) they occupy.
//
// Pure function of props — deterministic. All fills/strokes use var(--aka-*).

import type { ReactElement } from 'react'
import type { VedicChart } from '../../engines/vedic/types'

interface VedicChartProps {
  /** The complete Vedic chart. */
  chart: VedicChart
}

const CELL = 72
const PAD = 6
const W = CELL * 4 + PAD * 2
const H = CELL * 4 + PAD * 2

/** Rasi names (short form) indexed 0..11. */
const RASI_SHORT = [
  'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi',
]

/** Planet abbreviations for display in cells. */
const PLANET_ABBR: Record<string, string> = {
  sun: 'Su', moon: 'Mo', mercury: 'Me', venus: 'Ve', mars: 'Ma',
  jupiter: 'Ju', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke', ascendant: 'As',
}

/**
 * Fixed South-Indian grid positions for each rasi index (0..11).
 * The 4x4 grid has cells at (row, col) where row/col ∈ 0..3.
 * The perimeter cells (12 total) hold the 12 signs; center 2x2 is empty.
 *
 * Clockwise from top-left (2nd cell of top row = Aries):
 * Top row (left→right):  Pisces(11), Aries(0), Taurus(1), Gemini(2)
 * Right col (top→bot):   Cancer(3), Leo(4)
 * Bot row (right→left):  Virgo(5), Libra(6), Scorpio(7), Sagittarius(8)
 * Left col (bot→top):    Capricorn(9), Aquarius(10)
 */
const RASI_POS: ReadonlyArray<{ row: number; col: number }> = [
  { row: 0, col: 1 }, // 0  Aries
  { row: 0, col: 2 }, // 1  Taurus
  { row: 0, col: 3 }, // 2  Gemini
  { row: 1, col: 3 }, // 3  Cancer
  { row: 2, col: 3 }, // 4  Leo
  { row: 3, col: 3 }, // 5  Virgo
  { row: 3, col: 2 }, // 6  Libra
  { row: 3, col: 1 }, // 7  Scorpio
  { row: 3, col: 0 }, // 8  Sagittarius
  { row: 2, col: 0 }, // 9  Capricorn
  { row: 1, col: 0 }, // 10 Aquarius
  { row: 0, col: 0 }, // 11 Pisces
]

export function VedicChart({ chart }: VedicChartProps): ReactElement {
  // Build a map: rasiIndex → list of planet abbreviations in that sign.
  const byRasi = new Map<number, string[]>()
  // Lagna (ascendant) goes into its rasi.
  const lagnaRasi = chart.lagna.rasiIndex
  byRasi.set(lagnaRasi, ['As'])
  for (const p of chart.planets) {
    const abbr = PLANET_ABBR[p.body] ?? p.body.slice(0, 2)
    const arr = byRasi.get(p.rasiIndex) ?? []
    arr.push(abbr)
    byRasi.set(p.rasiIndex, arr)
  }

  const children: ReactElement[] = []
  // Background.
  children.push(
    <rect
      key="bg"
      x="0"
      y="0"
      width={W}
      height={H}
      fill="var(--aka-surface)"
      stroke="var(--aka-border)"
      strokeWidth="1"
    />,
  )

  // 12 sign cells on the perimeter.
  for (let rasi = 0; rasi < 12; rasi++) {
    const pos = RASI_POS[rasi]
    const x = PAD + pos.col * CELL
    const y = PAD + pos.row * CELL
    const planets = byRasi.get(rasi) ?? []
    const isLagna = rasi === lagnaRasi
    children.push(
      <rect
        key={`cell-${rasi}`}
        x={x}
        y={y}
        width={CELL}
        height={CELL}
        fill={isLagna ? 'var(--aka-accent-soft)' : 'var(--aka-surface-2)'}
        stroke="var(--aka-border-strong)"
        strokeWidth="1"
      />,
    )
    // Sign abbreviation (top-left corner).
    children.push(
      <text
        key={`rasi-${rasi}`}
        x={x + 6}
        y={y + 14}
        fontSize="10"
        fontFamily="var(--aka-font-mono)"
        fill="var(--aka-accent)"
      >
        {RASI_SHORT[rasi]}
      </text>,
    )
    // Planets in this sign (centered, wrapped).
    if (planets.length > 0) {
      const joined = planets.join(' ')
      const text = joined.length > 10 ? joined.slice(0, 9) + '…' : joined
      children.push(
        <text
          key={`planets-${rasi}`}
          x={x + CELL / 2}
          y={y + CELL / 2 + 6}
          textAnchor="middle"
          fontSize="12"
          fontFamily="var(--aka-font-body)"
          fill="var(--aka-fg)"
        >
          {text}
        </text>,
      )
    }
  }

  // Empty center 2x2 — diamond/label area.
  const cx = PAD + CELL
  const cy = PAD + CELL
  children.push(
    <rect
      key="center"
      x={cx}
      y={cy}
      width={CELL * 2}
      height={CELL * 2}
      fill="none"
      stroke="var(--aka-border)"
      strokeWidth="0.5"
    />,
  )
  children.push(
    <text
      key="center-label"
      x={cx + CELL}
      y={cy + CELL - 2}
      textAnchor="middle"
      fontSize="11"
      fontFamily="var(--aka-font-display)"
      fill="var(--aka-muted)"
    >
      Rasi
    </text>,
  )

  return (
    <svg
      data-chart="vedic"
      aria-label="Vedic South-Indian rasi chart"
      role="img"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
    >
      {children}
    </svg>
  )
}
