// src/pages/compat/Verdict.tsx — compatibility verdict display.
//
// Extracted from Compatibility.tsx as a mechanical split (todo 1 F2 debt).
// Renders the result of computeCompatibility: overall score + tone badge,
// each person's day-master element via the relationNote, the 六合/冲 branch
// note, per-domain scores, and a tlDr. Pure presentational — no state.

import type { ReactNode } from 'react'
import { Card, Badge } from '../../components/ui'
import type { CompatibilityResult } from '../../lib/compatibility'

/** Badge tone from a domain label — mirrors DomainCard.badgeTone. */
function badgeTone(label: string): 'success' | 'warning' | 'danger' {
  if (label === 'Tinggi') return 'success'
  if (label === 'Sedang') return 'warning'
  return 'danger'
}

/** Score color: 70+ success, 40-69 warning, <40 danger — matches dashboard. */
function scoreColor(score: number): string {
  if (score >= 70) return 'var(--aka-success)'
  if (score >= 40) return 'var(--aka-warning)'
  return 'var(--aka-danger)'
}

const TONE_LABEL: Record<CompatibilityResult['tone'], string> = {
  harmonis: 'Harmonis',
  netral: 'Netral',
  menantang: 'Menantang',
}

export interface VerdictProps {
  result: CompatibilityResult
}

export function Verdict({ result }: VerdictProps): ReactNode {
  return (
    <Card className="mt-6 p-6" raised>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl" style={{ color: 'var(--aka-fg)' }}>
          Skor Kecocokan
        </h3>
        <Badge
          tone={
            result.overall >= 70
              ? badgeTone('Tinggi')
              : result.overall >= 40
                ? badgeTone('Sedang')
                : badgeTone('Rendah')
          }
        >
          {TONE_LABEL[result.tone]}
        </Badge>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="font-display text-4xl tabular-nums"
          style={{ color: scoreColor(result.overall) }}
        >
          {result.overall}
        </span>
        <span className="font-mono text-sm" style={{ color: 'var(--aka-muted)' }}>
          /100
        </span>
      </div>

      <p className="mt-3 font-body text-sm" style={{ color: 'var(--aka-fg)' }}>
        {result.relationNote}
      </p>
      {result.branchNote ? (
        <p className="mt-1 font-body text-sm" style={{ color: 'var(--aka-fg)' }}>
          {result.branchNote}
        </p>
      ) : null}
      <p className="mt-3 font-body text-base" style={{ color: 'var(--aka-fg)' }}>
        {result.tlDr}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {result.domains.map((d) => (
          <div
            key={d.domain}
            className={
              'flex items-center justify-between rounded-sm ' +
              'border-2 border-border bg-surface px-3 py-2'
            }
          >
            <span className="font-body text-sm" style={{ color: 'var(--aka-fg)' }}>
              {d.domain}
            </span>
            <span className="flex items-center gap-2">
              <span
                className="font-mono text-sm tabular-nums"
                style={{ color: scoreColor(d.score) }}
              >
                {d.score}
              </span>
              <Badge tone={badgeTone(d.label)}>{d.label}</Badge>
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
