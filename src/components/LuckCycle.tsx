// src/components/LuckCycle.tsx — 大運 decade luck-pillar (Siklus Keberuntungan) strip.
//
// Renders a horizontally scrollable row of decade pills. Each pill shows the
// pillar's gan-zhi (stem char colored by its element via ELEMENT_COLOR), the
// age range (en dash), and the ending Gregorian year in mono. The first pill
// (empty ganZhi) is the pre-大運 period, labeled "Masa Kecil". The pill whose
// [startAge, endAge] contains currentAge (when provided) gets an accent border.
//
// All colors use var(--aka-*) tokens via inline styles (except the documented
// water hex). No Tailwind color utilities, no gradients, no blur.

import type { LuckPillar } from '../engines/bazi'
import { ELEMENT_COLOR, elementOfStem } from '../lib/bazi-elements'

interface LuckCycleProps {
  luck: readonly LuckPillar[]
  currentAge?: number
}

/** Whether the current age falls in this pillar's age range (inclusive). */
function isCurrent(p: LuckPillar, age: number): boolean {
  return age >= p.startAge && age <= p.endAge
}

export function LuckCycle({
  luck,
  currentAge,
}: LuckCycleProps): React.ReactNode {
  return (
    <div
      className="overflow-x-auto"
      role="group"
      aria-label="Siklus Keberuntungan (大運)"
    >
      <div className="flex min-w-max gap-2">
        {luck.map((p, i) => {
          const isChildhood = p.ganZhi === ''
          const highlighted =
            currentAge !== undefined && isCurrent(p, currentAge)
          const stemEl = isChildhood
            ? null
            : elementOfStem(p.ganZhi[0] ?? '')
          return (
            <div
              key={i}
              className="flex min-w-[7rem] flex-col items-center gap-1 border-2 p-2"
              style={{
                borderColor: highlighted
                  ? 'var(--aka-accent)'
                  : 'var(--aka-border)',
                backgroundColor: highlighted
                  ? 'var(--aka-accent-soft)'
                  : 'transparent',
              }}
            >
              {/* Label: Masa Kecil for index 0, else gan-zhi colored by stem */}
              <span className="font-display text-xl">
                {isChildhood ? (
                  <span style={{ color: 'var(--aka-muted)' }}>幼</span>
                ) : (
                  <span style={{ color: ELEMENT_COLOR[stemEl ?? 'earth'] }}>
                    {p.ganZhi}
                  </span>
                )}
              </span>
              {/* Sub-label: Masa Kecil / decade */}
              <span
                className="font-mono text-[10px] uppercase tracking-wide"
                style={{ color: 'var(--aka-muted)' }}
              >
                {isChildhood ? 'Masa Kecil' : '大運'}
              </span>
              {/* Age range (en dash) */}
              <span
                className="font-mono text-xs"
                style={{ color: 'var(--aka-fg)' }}
              >
                {p.startAge}–{p.endAge}
              </span>
              {/* End year (mono) */}
              <span
                className="font-mono text-[10px]"
                style={{ color: 'var(--aka-muted)' }}
              >
                {p.endYear}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
