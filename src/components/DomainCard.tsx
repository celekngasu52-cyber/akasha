// src/components/DomainCard.tsx — one domain's card on the dashboard.
//
// Renders: domain name + score (0-100) + agreement badge + tlDr line + 30-day
// TrendChart + collapsible WhyPanel (4 engine votes).
//
// All colors use var(--aka-*) tokens via the ui.tsx primitives and inline
// styles. No Tailwind color utilities, no hardcoded hex, no gradients.

import { Badge, Card } from './ui'
import { TrendChart } from './TrendChart'
import { WhyPanel, type WhyEngineVote } from './WhyPanel'

/** One engine vote — mirrors scorer.EngineDetail subset. */
export interface DomainCardEngineVote {
  readonly engine: string
  readonly vote: number
  readonly weight: number
  readonly alasanSingkat: string
}

export interface DomainCardProps {
  /** Domain name (Karier/Cinta/Kesehatan/Keuangan). */
  domain: string
  /** 0-100 agreement score. */
  score: number
  /** Agreement label (Tinggi/Sedang/Rendah). */
  label: string
  /** Short tlDr line (already formatted by narrative.ts or mock). */
  tlDr: string
  /** 30 daily trend points in [0,100]. */
  trend: readonly number[]
  /** 4 engine votes for the WhyPanel. */
  votes: readonly DomainCardEngineVote[]
}

function badgeTone(label: string): 'success' | 'warning' | 'danger' {
  if (label === 'Tinggi') return 'success'
  if (label === 'Sedang') return 'warning'
  return 'danger'
}

/** Score color: 70+ success, 40-69 warning, <40 danger. */
function scoreColor(score: number): string {
  if (score >= 70) return 'var(--aka-success)'
  if (score >= 40) return 'var(--aka-warning)'
  return 'var(--aka-danger)'
}

export function DomainCard({
  domain,
  score,
  label,
  tlDr,
  trend,
  votes,
}: DomainCardProps): React.ReactNode {
  const whyVotes: WhyEngineVote[] = votes.map((v) => ({
    engine: v.engine,
    vote: v.vote,
    weight: v.weight,
    alasanSingkat: v.alasanSingkat,
  }))

  return (
    <Card className="flex flex-col gap-3">
      {/* Header: domain + score + badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl" style={{ color: 'var(--aka-fg)' }}>
          {domain}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-2xl tabular-nums"
            style={{ color: scoreColor(score) }}
          >
            {score}
          </span>
          <Badge tone={badgeTone(label)}>{label}</Badge>
        </div>
      </div>

      {/* tlDr line */}
      <p
        className="font-body text-sm"
        style={{ color: 'var(--aka-fg)' }}
      >
        {tlDr}
      </p>

      {/* 30-day trend */}
      <TrendChart
        points={trend}
        ariaLabel={`Tren 30 hari ${domain}`}
      />

      {/* WhyPanel — 4 engine votes */}
      <WhyPanel votes={whyVotes} domain={domain} />
    </Card>
  )
}
