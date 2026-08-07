// src/ui/charts/BaziGrid.tsx — BaZi four-pillar SVG grid.
//
// Renders the 年/月/日/時 pillars as a 4-column grid: each column shows the
// heavenly stem (天干) glyph, the earthly branch (地支) glyph, and an optional
// ten-god (十神) label for the stem. Pure function of props — deterministic.
// All fills/strokes use var(--aka-*) tokens (no hex, no raster elements, no url refs).

import type { ReactElement } from 'react'
import type { FourPillars, TenGods } from '../../engines/bazi/types'

interface BaziGridProps {
  /** The four pillars (year/month/day/hour). */
  pillars: FourPillars
  /** Optional ten-gods overlay; when present the stem ten-god is shown. */
  tenGods?: TenGods
}

// Geometry constants — fixed so identical props yield identical SVG.
const COL_W = 56
const ROW_H = 44
const PAD = 8
const LABEL_H = 18
const W = COL_W * 4 + PAD * 2
const H = LABEL_H + ROW_H * 2 + PAD * 2

const SLOT_LABELS = ['年', '月', '日', '時'] as const

/** Pillar slot order matches the FourPillars interface fields. */
const SLOTS = ['year', 'month', 'day', 'hour'] as const

/**
 * Render one pillar column: a slot label, the stem glyph in a rect, and the
 * branch glyph in a rect below it. If a ten-god is provided it appears as a
 * small caption under the stem.
 */
function renderPillar(
  slot: (typeof SLOTS)[number],
  index: number,
  pillars: FourPillars,
  tenGods?: TenGods,
): ReactElement[] {
  const pillar = pillars[slot]
  const x = PAD + index * COL_W
  const labelY = PAD + LABEL_H - 4
  const stemY = PAD + LABEL_H
  const branchY = stemY + ROW_H
  const tg = tenGods?.[slot].stem
  const out: ReactElement[] = []
  out.push(
    <text
      key={`label-${slot}`}
      x={x + COL_W / 2}
      y={labelY}
      textAnchor="middle"
      fontSize="11"
      fontFamily="var(--aka-font-mono)"
      fill="var(--aka-muted)"
    >
      {SLOT_LABELS[index]}
    </text>,
  )
  out.push(
    <rect
      key={`stem-bg-${slot}`}
      x={x + 4}
      y={stemY + 2}
      width={COL_W - 8}
      height={ROW_H - 4}
      fill="var(--aka-surface-2)"
      stroke="var(--aka-border)"
      strokeWidth="1"
    />,
  )
  out.push(
    <text
      key={`stem-${slot}`}
      x={x + COL_W / 2}
      y={stemY + ROW_H / 2 + 6}
      textAnchor="middle"
      fontSize="20"
      fontFamily="var(--aka-font-display)"
      fill="var(--aka-fg)"
    >
      {pillar.stem}
    </text>,
  )
  if (tg) {
    out.push(
      <text
        key={`tg-${slot}`}
        x={x + COL_W / 2}
        y={stemY + ROW_H - 4}
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--aka-font-mono)"
        fill="var(--aka-accent)"
      >
        {tg}
      </text>,
    )
  }
  out.push(
    <rect
      key={`branch-bg-${slot}`}
      x={x + 4}
      y={branchY + 2}
      width={COL_W - 8}
      height={ROW_H - 4}
      fill="var(--aka-accent-soft)"
      stroke="var(--aka-border-strong)"
      strokeWidth="1"
    />,
  )
  out.push(
    <text
      key={`branch-${slot}`}
      x={x + COL_W / 2}
      y={branchY + ROW_H / 2 + 6}
      textAnchor="middle"
      fontSize="20"
      fontFamily="var(--aka-font-display)"
      fill="var(--aka-fg)"
    >
      {pillar.branch}
    </text>,
  )
  return out
}

export function BaziGrid({ pillars, tenGods }: BaziGridProps): ReactElement {
  const children: ReactElement[] = []
  for (let i = 0; i < 4; i++) {
    children.push(...renderPillar(SLOTS[i], i, pillars, tenGods))
  }
  return (
    <svg
      data-chart="bazi"
      aria-label="BaZi four-pillar chart"
      role="img"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
    >
      <rect
        x="0"
        y="0"
        width={W}
        height={H}
        fill="var(--aka-surface)"
        stroke="var(--aka-border)"
        strokeWidth="1"
      />
      {children}
    </svg>
  )
}
