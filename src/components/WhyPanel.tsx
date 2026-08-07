// src/components/WhyPanel.tsx — "Kenapa?" collapsible panel.
//
// Renders the 4 engine votes (BaZi/ZiWei/Vedic/Western) for one domain, each
// with non-empty vote, weight, and alasanSingkat. Collapsible (default closed)
// — chosen over a bottom sheet because the dashboard shows 4 domain cards per
// tab, and a bottom sheet would force a single global context switch whereas a
// per-card collapsible keeps each domain's reasoning local to its card.
//
// All colors use var(--aka-*) tokens. No hardcoded hex, no gradients.

import { useState } from 'react'
import { Badge } from './ui'

/** One engine's contribution — mirrors scorer.EngineDetail. */
export interface WhyEngineVote {
  readonly engine: string
  readonly vote: number
  readonly weight: number
  readonly alasanSingkat: string
}

export interface WhyPanelProps {
  /** 4 engine votes; order preserved. */
  votes: readonly WhyEngineVote[]
  /** Domain name for the toggle label. */
  domain: string
}

function voteTone(vote: number): 'success' | 'neutral' | 'danger' {
  if (vote > 0) return 'success'
  if (vote < 0) return 'danger'
  return 'neutral'
}

function voteLabel(vote: number): string {
  if (vote > 0) return '+1 dukung'
  if (vote < 0) return '-1 tekan'
  return '0 netral'
}

export function WhyPanel({ votes, domain }: WhyPanelProps): React.ReactNode {
  const [open, setOpen] = useState(false)
  const toggleCls =
    'flex w-full items-center justify-between font-mono text-xs uppercase tracking-wide'

  return (
    <div className="mt-3 border-t-2 border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`why-panel-${domain}`}
        className={toggleCls}
        style={{ color: 'var(--aka-muted)' }}
      >
        <span>Kenapa? — 4 engine</span>
        <span aria-hidden style={{ color: 'var(--aka-accent)' }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <ul
          id={`why-panel-${domain}`}
          className="mt-3 space-y-2"
          role="list"
        >
          {votes.map((v) => (
            <li
              key={v.engine}
              className="border border-border bg-surface-2 p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm" style={{ color: 'var(--aka-fg)' }}>
                  {v.engine}
                </span>
                <div className="flex items-center gap-2">
                  <Badge tone={voteTone(v.vote)}>{voteLabel(v.vote)}</Badge>
                  <Badge tone="neutral">w {v.weight.toFixed(2)}</Badge>
                </div>
              </div>
              <p
                className="mt-1 font-body text-sm"
                style={{ color: 'var(--aka-fg)' }}
              >
                {v.alasanSingkat}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
