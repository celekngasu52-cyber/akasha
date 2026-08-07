// src/pages/Report.tsx — premium printable "Laporan Lengkap" reading.
//
// Combines real natal data (BaZi four pillars + day-master strength from
// src/engines/bazi) with the 4-system summary and the 7-day daily forecast
// into a single print-optimized document. "Cetak / Simpan PDF" calls
// window.print() so the browser's native PDF dialog does the export — zero
// dependencies. On view, the profile is persisted to localStorage so the
// reading survives reloads.
//
// Print styling is scoped via an inline <style> block (@media print); the
// global theme.css is untouched. All colors use var(--aka-*) tokens.

import { useEffect } from 'react'
import type { BirthData } from '../core/birth'
import { Card, Badge, Button } from '../components/ui'
import {
  computeFourPillars,
  computeStrength,
  computeTenGods,
} from '../engines/bazi'
import {
  buildDashboardData,
  buildDailyForecast,
} from './dashboard-data'

const STORAGE_KEY = 'akasha:latest-profile'

const HORIZON_LABELS: Readonly<Record<string, string>> = Object.freeze({
  harian: 'Harian',
  mingguan: 'Mingguan',
  bulanan: 'Bulanan',
  tahunan: 'Tahunan',
})

const VERDICT_LABELS: Readonly<Record<string, string>> = Object.freeze({
  strong: 'Kuat',
  balanced: 'Seimbang',
  weak: 'Lemah',
})

export interface ReportProps {
  birthData: BirthData
  /** Back to the dashboard. */
  onBack: () => void
}

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

export function Report({ birthData, onBack }: ReportProps): React.ReactNode {
  const pillars = computeFourPillars(birthData)
  const strength = computeStrength(pillars)
  const tenGods = computeTenGods(birthData)
  const horizons = buildDashboardData(birthData)
  const daily = buildDailyForecast(birthData)

  // Persist the profile once per report view (client-only; SSR-safe).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(birthData))
    } catch (err: unknown) {
      console.error('Akasha: profil gagal disimpan ke penyimpanan lokal', err)
    }
  }, [birthData])

  return (
    <div
      className="mx-auto max-w-3xl px-4 py-8"
      style={{ color: 'var(--aka-fg)' }}
    >
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-avoid-break { break-inside: avoid; }
        }
      `}</style>

      {/* Toolbar — hidden in print */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Dashboard
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          Cetak / Simpan PDF
        </Button>
      </div>

      {/* Report header */}
      <header className="mb-8 border-b-2 border-border pb-4">
        <p
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: 'var(--aka-accent)' }}
        >
          Akasha · Laporan Lengkap
        </p>
        <h1
          className="font-display mt-1 text-3xl"
          style={{ color: 'var(--aka-fg)' }}
        >
          Peta Kelahiran {birthData.placeName}
        </h1>
        <p className="font-mono mt-2 text-sm" style={{ color: 'var(--aka-muted)' }}>
          {birthData.dateISO} · {birthData.timeISO ?? 'jam tidak diketahui'} ·{' '}
          {birthData.tzIANA} · {birthData.lat.toFixed(2)}, {birthData.lng.toFixed(2)}
          {birthData.isTimeEstimated ? ' · estimasi jam' : ''}
        </p>
      </header>

      {/* Real BaZi natal chart */}
      <section className="print-avoid-break mb-8">
        <h2
          className="font-display mb-3 text-xl"
          style={{ color: 'var(--aka-fg)' }}
        >
          Peta BaZi · Perhitungan Nyata
        </h2>
        <Card className="print-avoid-break flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Tahun', pillar: pillars.year },
              { label: 'Bulan', pillar: pillars.month },
              { label: 'Hari', pillar: pillars.day },
              { label: 'Jam', pillar: pillars.hour },
            ].map((p) => (
              <div key={p.label} className="flex flex-col items-center gap-1">
                <span className="font-mono text-xs" style={{ color: 'var(--aka-muted)' }}>
                  {p.label}
                </span>
                <span className="font-display text-2xl">{p.pillar.ganZhi}</span>
                <span className="font-mono text-xs" style={{ color: 'var(--aka-muted)' }}>
                  {p.pillar.stem} · {p.pillar.branch}
                </span>
              </div>
            ))}
          </div>
          <p className="font-body text-sm" style={{ color: 'var(--aka-fg)' }}>
            Kekuatan Hari Utama: {VERDICT_LABELS[strength.verdict] ?? strength.verdict}{' '}
            (skor {strength.score > 0 ? `+${strength.score}` : strength.score}).
          </p>
          <div className="border-t-2 border-border pt-2">
            <span
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: 'var(--aka-accent)' }}
            >
              Sepuluh Dewa (十神)
            </span>
            <div className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
              {[
                { label: 'Tahun', tg: tenGods.year },
                { label: 'Bulan', tg: tenGods.month },
                { label: 'Hari', tg: tenGods.day },
                { label: 'Jam', tg: tenGods.hour },
              ].map((t) => (
                <p key={t.label} className="font-body text-sm">
                  <span className="font-mono" style={{ color: 'var(--aka-muted)' }}>
                    {t.label}:
                  </span>{' '}
                  {t.tg.stem} · {t.tg.branches.join(', ')}
                </p>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* 7-day daily forecast */}
      <section className="print-avoid-break mb-8">
        <h2
          className="font-display mb-3 text-xl"
          style={{ color: 'var(--aka-fg)' }}
        >
          Ramalan Harian · 7 Hari
        </h2>
        <div className="flex flex-col gap-3">
          {daily.map((day) => (
            <Card key={day.dateISO} className="print-avoid-break flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h3 className="font-display text-lg">{day.relativeLabel}</h3>
                  <span className="font-mono text-xs" style={{ color: 'var(--aka-muted)' }}>
                    {day.dateLabel}
                  </span>
                </div>
                <Badge tone={badgeTone(day.agreementLabel)}>
                  {day.agreementLabel}
                </Badge>
              </div>
              <p className="font-body text-sm">{day.tlDr}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4-system agreement summary */}
      <section className="print-avoid-break mb-8">
        <h2
          className="font-display mb-3 text-xl"
          style={{ color: 'var(--aka-fg)' }}
        >
          Ringkasan 4 Sistem
        </h2>
        <div className="flex flex-col gap-3">
          {horizons.map((h) => (
            <Card key={h.horizon} className="print-avoid-break flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg">
                  {HORIZON_LABELS[h.horizon] ?? h.horizon}
                </h3>
                <span className="font-mono text-xs" style={{ color: 'var(--aka-muted)' }}>
                  tlDr
                </span>
              </div>
              <p className="font-body text-sm">{h.horizonTlDr}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {h.domains.map((d) => (
                  <span key={d.domain} className="font-body text-sm">
                    {d.domain}{' '}
                    <span
                      className="font-mono tabular-nums"
                      style={{ color: scoreColor(d.score.agreement) }}
                    >
                      {d.score.agreement}
                    </span>
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Methodology + glossary appendix */}
      <section className="print-avoid-break mb-8">
        <h2
          className="font-display mb-3 text-xl"
          style={{ color: 'var(--aka-fg)' }}
        >
          Metodologi & Glosarium
        </h2>
        <Card className="print-avoid-break flex flex-col gap-3">
          <p className="font-body text-sm">
            Akasha memadukan empat tradisi astrologi independen: BaZi (China),
            Zi Wei Dou Shu (China), Vedic (India), dan Western (Barat). Setiap
            sistem dihitung terpisah dari data kelahiran Anda, lalu disintesis
            menjadi skor persetujuan di empat ranah: Karier, Cinta, Kesehatan,
            dan Keuangan.
          </p>
          <p className="font-body text-sm">
            Day Master (日主) adalah unsur inti diri Anda, ditentukan oleh batang
            hari kelahiran. Empat Pilar (四柱) memetakan energi tahun, bulan,
            hari, dan jam kelahiran. Sepuluh Dewa (十神) membaca hubungan setiap
            pilar terhadap Day Master. Persetujuan lintas sistem dianggap sinyal
            yang lebih kuat daripada satu tradisi saja.
          </p>
          <p className="font-body text-sm">
            Semua perhitungan berjalan lokal di perangkat Anda; data kelahiran
            tidak pernah dikirim ke server. Ramalan bersifat informatif, bukan
            pengganti keputusan medis, hukum, atau keuangan.
          </p>
        </Card>
      </section>

      <footer
        className="font-mono text-xs"
        style={{ color: 'var(--aka-muted)' }}
      >
        Dibuat oleh Akasha · data lokal di perangkat Anda · profil tersimpan otomatis.
      </footer>
    </div>
  )
}
