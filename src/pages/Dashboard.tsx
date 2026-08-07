// src/pages/Dashboard.tsx — 4-tab horizon dashboard.
//
// Tabs: harian / mingguan / bulanan / tahunan. Each tab renders 4 domain cards
// (Karier/Cinta/Kesehatan/Keuangan) with score 0-100 + agreement badge + tlDr
// + 30-day TrendChart + collapsible WhyPanel (4 engine votes).
//
// Data is currently mock (see dashboard-mock.ts) until todo 17/19 wire the real
// Chart4 -> scorer -> narrative pipeline. The swap is a single import change.
//
// Routing: no react-router (not a dep, cannot add deps). The dashboard is
// rendered by App.tsx via a useState route switch. Tabs within the dashboard
// are also useState — the 4 horizons.
//
// Colors: all var(--aka-*) tokens via ui.tsx primitives + inline styles.

import { useMemo, useState } from 'react'
import type { BirthData } from '../core/birth'
import { Section, Tabs, Button } from '../components/ui'
import { DomainCard } from '../components/DomainCard'
import {
  buildDashboardData,
  DASHBOARD_DOMAINS,
} from './dashboard-mock'

export interface DashboardProps {
  /** Birth data from InputPage (currently unused by mock — wired for todo 17). */
  birthData: BirthData
  /** Return to the input page. */
  onReset: () => void
}

const TAB_ITEMS = [
  { id: 'harian', label: 'Harian' },
  { id: 'mingguan', label: 'Mingguan' },
  { id: 'bulanan', label: 'Bulanan' },
  { id: 'tahunan', label: 'Tahunan' },
] as const

export function Dashboard({ onReset }: DashboardProps): React.ReactNode {
  const [tab, setTab] = useState<string>('harian')
  // Build once — deterministic mock; recompute only if birthData later feeds it.
  const data = useMemo(() => buildDashboardData(), [])
  const active = data.find((d) => d.horizon === tab) ?? data[0]!

  return (
    <Section eyebrow="Ringkasan" title="Dashboard Astrologi">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Tabs
          items={TAB_ITEMS as unknown as { id: string; label: string }[]}
          value={tab}
          onChange={setTab}
        />
        <Button variant="ghost" size="sm" onClick={onReset}>
          ← Ubah data
        </Button>
      </div>

      {/* Horizon tlDr — built via narrative.buildTlDr, shown per tab */}
      <div
        className="mb-5 border-2 border-border bg-surface-2 p-3"
        style={{ boxShadow: 'var(--aka-shadow-sm)' }}
      >
        <p
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: 'var(--aka-accent)' }}
        >
          tlDr — {active.horizon}
        </p>
        <p
          className="mt-1 font-body text-base"
          style={{ color: 'var(--aka-fg)' }}
        >
          {active.horizonTlDr}
        </p>
      </div>

      {/* 4 domain cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {active.domains.map((entry, i) => {
          const domainName = DASHBOARD_DOMAINS[i]!
          return (
            <DomainCard
              key={`${active.horizon}-${domainName}`}
              domain={domainName}
              score={entry.score.agreement}
              label={entry.score.label}
              tlDr={`Skor ${entry.score.agreement}/100 — ${entry.score.label}.`}
              trend={entry.trend}
              votes={entry.score.details.map((d) => ({
                engine: d.engine,
                vote: d.vote,
                weight: d.weight,
                alasanSingkat: d.alasanSingkat,
              }))}
            />
          )
        })}
      </div>
    </Section>
  )
}
