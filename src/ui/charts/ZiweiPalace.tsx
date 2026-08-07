// src/ui/charts/ZiweiPalace.tsx — Zi Wei Dou Shu 12-palace square ring.
//
// Traditional layout: a 4x4 grid where the 12 palaces occupy the perimeter
// cells and the center 2x2 is empty. Palaces are indexed by earthly branch
// (子=0 .. 亥=11); branch 子 sits at the bottom-center cell and the sequence
// proceeds counter-clockwise. Each cell shows the branch glyph, palace name,
// and star names (truncated with ellipsis if they overflow).
//
// Pure function of props — deterministic. All fills/strokes use var(--aka-*).

import type { ReactElement } from 'react'
import type { ZiWeiChart } from '../../engines/ziwei/types'

interface ZiweiPalaceProps {
  /** The complete ZiWei chart (12 palaces + si-hua). */
  chart: ZiWeiChart
}

const CELL = 84
const PAD = 6
const W = CELL * 4 + PAD * 2
const H = CELL * 4 + PAD * 2

/**
 * Perimeter cell positions for the 12 palaces, indexed by branchIndex (子=0).
 * Order: starting at bottom-center (row 3, col 1), going counter-clockwise:
 * 子 bottom-center, 丑 bottom-left, 寅 top-left, 卯 left-mid-top,
 * 辰 top-left-2, 巳 top-center, 午 top-right, 未 top-right-2, 酉 right-mid,
 * 戌 bottom-right-2, 亥 bottom-right.
 *
 * Actually the canonical ZiWei grid is 4x4 with the 4 corner cells shared.
 * The 12 perimeter positions in counter-clockwise order from bottom-center:
 */
const PERIMETER: ReadonlyArray<{ row: number; col: number }> = [
  { row: 3, col: 1 }, // 0  子 bottom-center-left
  { row: 3, col: 0 }, // 1  丑 bottom-left
  { row: 2, col: 0 }, // 2  寅 mid-left-bottom
  { row: 1, col: 0 }, // 3  卯 mid-left-top
  { row: 0, col: 0 }, // 4  辰 top-left
  { row: 0, col: 1 }, // 5  巳 top-center-left
  { row: 0, col: 2 }, // 6  午 top-center-right
  { row: 0, col: 3 }, // 7  未 top-right
  { row: 1, col: 3 }, // 8  申 mid-right-top
  { row: 2, col: 3 }, // 9  酉 mid-right-bottom
  { row: 3, col: 3 }, // 10 戌 bottom-right
  { row: 3, col: 2 }, // 11 亥 bottom-center-right
]

/** Truncate star names to fit a cell width; append ellipsis on overflow. */
function truncateStars(stars: string[], max: number): string {
  const joined = stars.join(' ')
  if (joined.length <= max) return joined
  return joined.slice(0, Math.max(0, max - 1)) + '…'
}

export function ZiweiPalace({ chart }: ZiweiPalaceProps): ReactElement {
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
  // Empty center 2x2 — drawn as a raised panel with the chart title.
  const cx = PAD + CELL
  const cy = PAD + CELL
  children.push(
    <rect
      key="center"
      x={cx}
      y={cy}
      width={CELL * 2}
      height={CELL * 2}
      fill="var(--aka-surface-2)"
      stroke="var(--aka-border)"
      strokeWidth="1"
    />,
  )
  children.push(
    <text
      key="center-title"
      x={cx + CELL}
      y={cy + CELL - 6}
      textAnchor="middle"
      fontSize="13"
      fontFamily="var(--aka-font-display)"
      fill="var(--aka-fg)"
    >
      紫微斗數
    </text>,
  )
  children.push(
    <text
      key="center-bureau"
      x={cx + CELL}
      y={cy + CELL + 14}
      textAnchor="middle"
      fontSize="10"
      fontFamily="var(--aka-font-mono)"
      fill="var(--aka-muted)"
    >
      {chart.naYinBureau.name}
    </text>,
  )

  // 12 palace cells.
  for (const palace of chart.palaces) {
    const pos = PERIMETER[palace.branchIndex]
    if (!pos) continue
    const x = PAD + pos.col * CELL
    const y = PAD + pos.row * CELL
    const isMing = palace.isMingGong
    children.push(
      <rect
        key={`cell-${palace.branchIndex}`}
        x={x}
        y={y}
        width={CELL}
        height={CELL}
        fill={isMing ? 'var(--aka-accent-soft)' : 'var(--aka-surface)'}
        stroke="var(--aka-border-strong)"
        strokeWidth="1"
      />,
    )
    // Branch glyph (top-left corner).
    children.push(
      <text
        key={`branch-${palace.branchIndex}`}
        x={x + 8}
        y={y + 16}
        fontSize="14"
        fontFamily="var(--aka-font-display)"
        fill="var(--aka-accent)"
      >
        {palace.branch}
      </text>,
    )
    // Palace name (top-right).
    children.push(
      <text
        key={`name-${palace.branchIndex}`}
        x={x + CELL - 4}
        y={y + 16}
        textAnchor="end"
        fontSize="9"
        fontFamily="var(--aka-font-mono)"
        fill="var(--aka-muted)"
      >
        {palace.name}
      </text>,
    )
    // Stars (centered, truncated).
    const starNames = palace.stars.map((s) => s.name)
    const starText = truncateStars(starNames, 10)
    if (starText) {
      children.push(
        <text
          key={`stars-${palace.branchIndex}`}
          x={x + CELL / 2}
          y={y + CELL / 2 + 8}
          textAnchor="middle"
          fontSize="11"
          fontFamily="var(--aka-font-body)"
          fill="var(--aka-fg)"
        >
          {starText}
        </text>,
      )
    }
    // Age range (bottom).
    if (palace.ageRange) {
      children.push(
        <text
          key={`age-${palace.branchIndex}`}
          x={x + CELL / 2}
          y={y + CELL - 6}
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--aka-font-mono)"
          fill="var(--aka-muted)"
        >
          {palace.ageRange}
        </text>,
      )
    }
  }
  return (
    <svg
      data-chart="ziwei"
      aria-label="ZiWei 12-palace chart"
      role="img"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
    >
      {children}
    </svg>
  )
}
