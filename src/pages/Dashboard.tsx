// src/pages/Dashboard.tsx — 4-tab horizon dashboard.
//
// Tabs: harian / mingguan / bulanan / tahunan. The harian tab renders a
// 7-day forecast list (today + 6) with date, 4 domain scores, and a tlDr per
// day. The other tabs render 4 domain cards (Karier/Cinta/Kesehatan/Keuangan)
// with score 0-100 + agreement badge + tlDr + 30-day TrendChart + collapsible
// WhyPanel (4 engine votes).
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
import { Section, Tabs, Button, Card, Badge } from '../components/ui'
import { DomainCard } from '../components/DomainCard'
import { GlossaryPopover } from '../components/GlossaryPopover'
import { useDarkMode } from '../hooks/useDarkMode'
import { saveProfile } from '../lib/profileStore'
import {
  buildDashboardData,
  buildDailyForecast,
  DASHBOARD_DOMAINS,
} from './dashboard-mock'

export interface DashboardProps {
  /** Birth data from InputPage (currently unused by mock — wired for todo 17). */
  birthData: BirthData
  /** Return to the input page. */
  onReset: () => void
  /** Open the printable "Laporan Lengkap" report (optional). */
  onOpenReport?: () => void
  /** Open the two-person compatibility "Jodoh" page (optional). */
  onOpenCompatibility?: () => void
  /** Open the saved-profile collection (optional). */
  onOpenCollection?: () => void
}

const TAB_ITEMS = [
  { id: 'harian', label: 'Harian' },
  { id: 'mingguan', label: 'Mingguan' },
  { id: 'bulanan', label: 'Bulanan' },
  { id: 'tahunan', label: 'Tahunan' },
] as const

/** Badge tone from an agreement label — mirrors DomainCard.badgeTone. */
function badgeTone(label: string): 'success' | 'warning' | 'danger' {
  if (label === 'Tinggi') return 'success'
  if (label === 'Sedang') return 'warning'
  return 'danger'
}

/** Score color: 70+ success, 40-69 warning, <40 danger — mirrors DomainCard. */
function scoreColor(score: number): string {
  if (score >= 70) return 'var(--aka-success)'
  if (score >= 40) return 'var(--aka-warning)'
  return 'var(--aka-danger)'
}

export function Dashboard({
  birthData,
  onReset,
  onOpenReport,
  onOpenCompatibility,
  onOpenCollection,
}: DashboardProps): React.ReactNode {
  const [tab, setTab] = useState<string>('harian')
  const [saved, setSaved] = useState(false)
  const { isDark, toggle } = useDarkMode()
  const data = useMemo(() => buildDashboardData(), [])
  // Captures "today" at first render; rolls forward on reload.
  const daily = useMemo(() => buildDailyForecast(), [])
  const active = data.find((d) => d.horizon === tab) ?? data[0]!

  return (
    <Section eyebrow="Ringkasan" title="Dashboard Astrologi">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Tabs
          items={TAB_ITEMS as unknown as { id: string; label: string }[]}
          value={tab}
          onChange={setTab}
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggle} aria-label="Ganti tema">
            {isDark ? '☀' : '☾'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              saveProfile(birthData)
              setSaved(true)
            }}
          >
            {saved ? '✓ Tersimpan' : 'Simpan'}
          </Button>
          {onOpenCollection ? (
            <Button variant="ghost" size="sm" onClick={onOpenCollection}>
              Koleksi
            </Button>
          ) : null}
          {onOpenCompatibility ? (
            <Button variant="ghost" size="sm" onClick={onOpenCompatibility}>
              Jodoh
            </Button>
          ) : null}
          {onOpenReport ? (
            <Button variant="ghost" size="sm" onClick={onOpenReport}>
              Laporan Lengkap
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onReset}>
            ← Ubah data
          </Button>
        </div>
      </div>

      {tab === 'harian' ? (
        <div className="flex flex-col gap-3">
          {daily.map((entry) => (
            <Card key={entry.dateISO} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h3
                    className="font-display text-lg"
                    style={{ color: 'var(--aka-fg)' }}
                  >
                    {entry.relativeLabel}
                  </h3>
                  <span
                    className="font-mono text-xs"
                    style={{ color: 'var(--aka-muted)' }}
                  >
                    {entry.dateLabel}
                  </span>
                </div>
                <Badge tone={badgeTone(entry.agreementLabel)}>
                  {entry.agreementLabel}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {entry.domains.map((d) => (
                  <span
                    key={d.domain}
                    className="font-body text-sm"
                    style={{ color: 'var(--aka-fg)' }}
                  >
                    {d.domain}{' '}
                    <span
                      className="font-mono text-sm tabular-nums"
                      style={{ color: scoreColor(d.score) }}
                    >
                      {d.score}
                    </span>
                  </span>
                ))}
              </div>
              <p
                className="font-body text-sm"
                style={{ color: 'var(--aka-fg)' }}
              >
                {entry.tlDr}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Horizon tlDr — built via narrative.buildTlDr, shown per tab */}
          <div
            className="mb-5 border-2 border-border bg-surface-2 p-3"
            style={{ boxShadow: 'var(--aka-shadow-sm)' }}
          >
            <p
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: 'var(--aka-accent)' }}
            >
              tlDr — {active.horizon}{' '}
              <GlossaryPopover term="agreement score" label="?" />
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
        </>
      )}
    </Section>
  )
}
