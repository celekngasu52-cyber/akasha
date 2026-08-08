// src/components/ElementBars.tsx — five-element (五行) balance bar chart.
//
// Renders one row per element: label (Indonesian + glyph), a horizontal track
// with a colored fill proportional to the element's share, and the percentage.
// Div-based (no SVG) so it is print-safe and renders in static markup.
//
// All colors use var(--aka-*) tokens via inline styles except water, which uses
// the documented muted-blue hex from bazi-elements.ELEMENT_COLOR. No Tailwind
// color utilities, no gradients, no blur.

import {
  FIVE_ELEMENTS,
  ELEMENT_LABEL_ID,
  ELEMENT_GLYPH,
  ELEMENT_COLOR,
  elementShare,
  type ElementTally,
} from '../lib/bazi-elements'

interface ElementBarsProps {
  tally: ElementTally
  ariaLabel?: string
}

/** Round to nearest integer percent (0..100). */
function pct(n: number): number {
  return Math.round(n * 100)
}

export function ElementBars({
  tally,
  ariaLabel = 'Keseimbangan Lima Unsur',
}: ElementBarsProps): React.ReactNode {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="flex flex-col gap-2"
    >
      {FIVE_ELEMENTS.map((el) => {
        const share = elementShare(tally, el)
        const percent = pct(share)
        return (
          <div key={el} className="flex items-center gap-2">
            {/* Label: Indonesian name + glyph */}
            <span
              className="flex w-24 shrink-0 items-center gap-1 font-mono text-xs"
              style={{ color: 'var(--aka-fg)' }}
            >
              <span style={{ color: ELEMENT_COLOR[el] }}>
                {ELEMENT_GLYPH[el]}
              </span>
              {ELEMENT_LABEL_ID[el]}
            </span>
            {/* Track */}
            <div
              className="h-3 flex-1 border-2"
              style={{
                backgroundColor: 'var(--aka-surface-2)',
                borderColor: 'var(--aka-border)',
              }}
            >
              {/* Fill */}
              <div
                className="h-full"
                style={{
                  width: `${percent}%`,
                  backgroundColor: ELEMENT_COLOR[el],
                }}
              />
            </div>
            {/* Percentage */}
            <span
              className="w-10 shrink-0 text-right font-mono text-xs tabular-nums"
              style={{ color: 'var(--aka-muted)' }}
            >
              {percent}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
