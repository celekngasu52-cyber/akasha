// src/ui/charts/WesternWheel.tsx — Western tropical natal chart wheel.
//
// Renders a circular wheel: an outer ring divided into 12 zodiac segments
// (Aries=0 .. Pisces=11), 12 house cusp lines radiating from center, and
// planet dots placed at their tropical ecliptic longitude with glyph labels.
// Pure function of props — deterministic. All fills/strokes use var(--aka-*).

import type { ReactElement } from 'react'
import type { WesternChart } from '../../engines/western/types'

interface WesternWheelProps {
  /** The complete Western natal chart. */
  chart: WesternChart
}

const SIZE = 320
const CX = SIZE / 2
const CY = SIZE / 2
const R_OUTER = 150
const R_ZODIAC = 132
const R_INNER = 120
const R_HOUSE_LABEL = 100
const R_PLANET = 78

const ZODIAC_GLYPHS = [
  '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓',
]

const PLANET_GLYPHS: Record<string, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  ascendant: 'AC', midheaven: 'MC',
}

/** Convert degrees to point on a circle of given radius. */
function polar(deg: number, r: number): { x: number; y: number } {
  // Astrology wheels: 0° Aries at the 9 o'clock position (left), going
  // counter-clockwise. SVG y-axis is flipped, so we negate the sin.
  const rad = (deg * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) }
}

/** Build an SVG arc path between two angles on a circle of radius r. */
function arcPath(
  startDeg: number,
  endDeg: number,
  r: number,
): string {
  const s = polar(startDeg, r)
  const e = polar(endDeg, r)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`
}

export function WesternWheel({ chart }: WesternWheelProps): ReactElement {
  const children: ReactElement[] = []
  // Background circle.
  children.push(
    <circle
      key="bg"
      cx={CX}
      cy={CY}
      r={R_OUTER}
      fill="var(--aka-surface)"
      stroke="var(--aka-border)"
      strokeWidth="1"
    />,
  )

  // 12 zodiac segments — alternating fills for readability.
  for (let i = 0; i < 12; i++) {
    const start = i * 30
    const end = (i + 1) * 30
    const segPath = `${arcPath(start, end, R_ZODIAC)} ` +
      `${arcPath(end, start, R_OUTER).replace('M', 'L')} Z`
    children.push(
      <path
        key={`zod-${i}`}
        d={segPath}
        fill={i % 2 === 0 ? 'var(--aka-surface)' : 'var(--aka-surface-2)'}
        stroke="var(--aka-border)"
        strokeWidth="0.5"
      />,
    )
    // Zodiac glyph at segment midpoint.
    const mid = polar(start + 15, (R_ZODIAC + R_OUTER) / 2)
    children.push(
      <text
        key={`zod-glyph-${i}`}
        x={mid.x}
        y={mid.y + 5}
        textAnchor="middle"
        fontSize="12"
        fontFamily="var(--aka-font-mono)"
        fill="var(--aka-accent)"
      >
        {ZODIAC_GLYPHS[i]}
      </text>,
    )
  }

  // House cusp lines from center to inner ring.
  for (const house of chart.houses) {
    const p = polar(house.longitudeDeg, R_INNER)
    children.push(
      <line
        key={`house-${house.index}`}
        x1={CX}
        y1={CY}
        x2={p.x}
        y2={p.y}
        stroke="var(--aka-border-strong)"
        strokeWidth="0.75"
      />,
    )
    // House number label.
    const hp = polar(house.longitudeDeg + 2, R_HOUSE_LABEL)
    children.push(
      <text
        key={`house-num-${house.index}`}
        x={hp.x}
        y={hp.y + 3}
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--aka-font-mono)"
        fill="var(--aka-muted)"
      >
        {house.index}
      </text>,
    )
  }

  // Inner ring circle.
  children.push(
    <circle
      key="inner-ring"
      cx={CX}
      cy={CY}
      r={R_INNER}
      fill="none"
      stroke="var(--aka-border)"
      strokeWidth="1"
    />,
  )

  // Planet dots + glyphs at their ecliptic longitude.
  const allPositions = [
    ...chart.planets,
    chart.angles.ascendant,
    chart.angles.midheaven,
  ]
  for (const pos of allPositions) {
    const glyph = PLANET_GLYPHS[pos.name] ?? pos.name.slice(0, 2)
    const p = polar(pos.longitudeDeg, R_PLANET)
    children.push(
      <circle
        key={`planet-dot-${pos.name}`}
        cx={p.x}
        cy={p.y}
        r="3"
        fill="var(--aka-fg)"
      />,
    )
    children.push(
      <text
        key={`planet-glyph-${pos.name}`}
        x={p.x}
        y={p.y - 6}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--aka-font-mono)"
        fill="var(--aka-fg)"
      >
        {glyph}
      </text>,
    )
  }

  // Center point.
  children.push(
    <circle
      key="center"
      cx={CX}
      cy={CY}
      r="2"
      fill="var(--aka-accent)"
    />,
  )

  return (
    <svg
      data-chart="western"
      aria-label="Western natal chart wheel"
      role="img"
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
    >
      {children}
    </svg>
  )
}
