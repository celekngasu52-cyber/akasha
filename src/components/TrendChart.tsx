// src/components/TrendChart.tsx — hand-rolled SVG 30-day line chart.
//
// No external chart library (no recharts/d3/chart.js). Uses <polyline> with a
// <path> baseline fill for visual weight. ALL colors come from var(--aka-*)
// tokens — no hardcoded hex, no Tailwind color utilities. Per the design
// language: sharp 2px stroke, hard offset, no gradients, no blur.
//
// Determinism: the chart is pure — given the same `points` it renders the same
// SVG. Points are 30 integers in [0,100]; out-of-range values are clamped.

import { useMemo } from 'react'

export interface TrendChartProps {
  /** 30 daily values in [0,100]. Length other than 30 is rendered as-is. */
  points: readonly number[]
  /** Accessible label for the chart. */
  ariaLabel: string
  /** Optional width/height in px (defaults: 240x64). */
  width?: number
  height?: number
}

const PAD_X = 4
const PAD_Y = 6

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function TrendChart({
  points,
  ariaLabel,
  width = 240,
  height = 64,
}: TrendChartProps): React.ReactNode {
  const { line, area, dots } = useMemo(() => {
    const n = points.length
    if (n === 0) return { line: '', area: '', dots: [] as string[] }
    const innerW = width - PAD_X * 2
    const innerH = height - PAD_Y * 2
    const xStep = n > 1 ? innerW / (n - 1) : 0
    const toX = (i: number): number => PAD_X + i * xStep
    const toY = (v: number): number =>
      PAD_Y + innerH - (clamp(v, 0, 100) / 100) * innerH

    const coords = points.map((p, i) => [toX(i), toY(p)] as const)

    const linePath = coords
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ')

    const areaPath =
      `M${coords[0]![0].toFixed(1)},${(height - PAD_Y).toFixed(1)} ` +
      coords.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') +
      ` L${coords[n - 1]![0].toFixed(1)},${(height - PAD_Y).toFixed(1)} Z`

    const dotEls = coords.map(
      ([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5" />`,
    )

    return { line: linePath, area: areaPath, dots: dotEls }
  }, [points, width, height])

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full"
      style={{ display: 'block' }}
    >
      {/* Baseline area fill — uses surface-2 token for subtle weight. */}
      <path
        d={area}
        fill="var(--aka-surface-2)"
        stroke="none"
      />
      {/* Gridline at 50% — border token, very subtle. */}
      <line
        x1={PAD_X}
        y1={PAD_Y + (height - PAD_Y * 2) / 2}
        x2={width - PAD_X}
        y2={PAD_Y + (height - PAD_Y * 2) / 2}
        stroke="var(--aka-border)"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      {/* Main trend line — accent token, sharp 2px stroke. */}
      <polyline
        points={line
          .replace(/M|L/g, '')
          .trim()
          .split(/\s+/)
          .join(' ')}
        fill="none"
        stroke="var(--aka-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Endpoints + key dots — fg token for emphasis. */}
      <g
        fill="var(--aka-fg)"
        dangerouslySetInnerHTML={{ __html: dots.join('') }}
      />
    </svg>
  )
}
