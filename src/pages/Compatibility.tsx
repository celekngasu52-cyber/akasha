// src/pages/Compatibility.tsx — two-person "Jodoh" compatibility page.
//
// Person A is passed in (the current user's birth data). The page collects
// person B via a compact form mirroring InputPage (date / time / city
// combobox), then renders the verdict from computeCompatibility: overall
// score + tone, each person's day-master element, the 生克 relation, the
// 六合/冲 branch note, per-domain scores, and a tlDr.
//
// The form is duplicated from InputPage rather than shared because InputPage
// emits a full submit-redirect; here we only need to build person B in place.
// Pure logic lives in src/lib/compatibility.ts so it is unit-testable without
// a DOM.

import { useState, useMemo, useCallback, type KeyboardEvent, type ReactNode } from 'react'
import { Button, Card, Badge } from '../components/ui'
import type { BirthData } from '../core/birth/types'
import {
  getCities,
  filterCities,
  validateDate,
  validateTime,
  MAX_SUGGESTIONS,
  MIN_YEAR,
  MAX_YEAR,
  type CityEntry,
} from './input-utils'
import { computeCompatibility, type CompatibilityResult } from '../lib/compatibility'

export interface CompatibilityProps {
  /** Person A — the current user's birth data. */
  birthDataA: BirthData
  /** Return to the dashboard. */
  onBack: () => void
}

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

const inputClass = [
  'w-full px-3 py-2 rounded-sm border-2 border-border bg-surface',
  'text-fg font-body focus:outline-none focus:border-accent',
].join(' ')
const labelClass = 'block mb-1 text-sm font-mono text-muted'
const errorClass = 'mt-1 text-sm text-danger'
const hintClass = 'mt-1 text-xs text-muted'

export function Compatibility({
  birthDataA,
  onBack,
}: CompatibilityProps): ReactNode {
  const [dateISO, setDateISO] = useState('')
  const [timeISO, setTimeISO] = useState('')
  const [isTimeEstimated, setIsTimeEstimated] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<CityEntry | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<CompatibilityResult | null>(null)

  // Combobox state (WAI-ARIA pattern mirrored from InputPage).
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const suggestions = useMemo(
    () => filterCities(query, MAX_SUGGESTIONS),
    [query],
  )

  const selectCity = (city: CityEntry) => {
    setSelectedCity(city)
    setQuery(city.name)
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown') {
          setIsOpen(true)
          setActiveIndex(0)
          e.preventDefault()
        }
        return
      }
      if (e.key === 'ArrowDown') {
        setActiveIndex((i) => (i + 1) % suggestions.length)
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
        e.preventDefault()
      } else if (e.key === 'Enter') {
        const hit = suggestions[activeIndex]
        if (hit) {
          selectCity(hit)
          e.preventDefault()
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    },
    [isOpen, suggestions, activeIndex],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    const dateErr = validateDate(dateISO)
    const timeErr = validateTime(timeISO, isTimeEstimated)
    if (dateErr) newErrors.date = dateErr
    if (timeErr) newErrors.time = timeErr
    if (!selectedCity) newErrors.city = 'Kota / kabupaten wajib diisi.'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0 || !selectedCity) return

    const birthDataB: BirthData = {
      dateISO,
      timeISO: isTimeEstimated || !timeISO ? null : timeISO,
      lat: selectedCity.lat,
      lng: selectedCity.lng,
      tzIANA: selectedCity.tzIANA,
      placeName: selectedCity.name,
      isTimeEstimated,
    }
    setResult(computeCompatibility(birthDataA, birthDataB))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl" style={{ color: 'var(--aka-fg)' }}>
          Kompatibilitas Pasangan
        </h2>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Kembali
        </Button>
      </div>

      <Card className="p-6" raised>
        <h3 className="font-display text-lg mb-1 text-fg">Data Pasangan (B)</h3>
        <p className="mb-4 font-body text-sm" style={{ color: 'var(--aka-muted)' }}>
          Lengkapi data kelahiran pasangan untuk melihat kecocokan dengan Anda.
        </p>
        <form onSubmit={handleSubmit} noValidate>
          {/* Date */}
          <div className="mb-4">
            <label htmlFor="compat-date" className={labelClass}>
              Tanggal Lahir
            </label>
            <input
              id="compat-date"
              type="date"
              value={dateISO}
              min={`${MIN_YEAR}-01-01`}
              max={`${MAX_YEAR}-12-31`}
              onChange={(e) => setDateISO(e.target.value)}
              className={inputClass}
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? 'compat-date-error' : undefined}
            />
            {errors.date ? (
              <p id="compat-date-error" className={errorClass} role="alert">
                {errors.date}
              </p>
            ) : null}
          </div>

          {/* Time */}
          <div className="mb-4">
            <label htmlFor="compat-time" className={labelClass}>
              Waktu Lahir
            </label>
            <input
              id="compat-time"
              type="time"
              value={timeISO}
              onChange={(e) => setTimeISO(e.target.value)}
              className={inputClass}
              disabled={isTimeEstimated}
              aria-invalid={!!errors.time}
              aria-describedby={errors.time ? 'compat-time-error' : undefined}
            />
            <label className="mt-2 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isTimeEstimated}
                onChange={(e) => {
                  setIsTimeEstimated(e.target.checked)
                  if (e.target.checked) setTimeISO('')
                }}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm font-body" style={{ color: 'var(--aka-fg)' }}>
                Waktu perkiraan (tidak diketahui pasti)
              </span>
            </label>
            {errors.time ? (
              <p id="compat-time-error" className={errorClass} role="alert">
                {errors.time}
              </p>
            ) : null}
          </div>

          {/* City combobox — WAI-ARIA pattern mirrored from InputPage. */}
          <div className="mb-4">
            <label htmlFor="compat-city" className={labelClass}>
              Kota / Kabupaten Tempat Lahir
            </label>
            <div className="relative">
              <input
                id="compat-city"
                type="text"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls="compat-city-listbox"
                aria-autocomplete="list"
                aria-activedescendant={
                  isOpen && activeIndex >= 0
                    ? `compat-city-option-${activeIndex}`
                    : undefined
                }
                aria-describedby="compat-city-hint"
                aria-invalid={!!errors.city}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedCity(null)
                  setIsOpen(true)
                  setActiveIndex(-1)
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 120)}
                onKeyDown={handleKeyDown}
                className={inputClass}
                placeholder="Ketik nama kota..."
              />
              {isOpen ? (
                <ul
                  id="compat-city-listbox"
                  role="listbox"
                  className={
                    'absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-sm ' +
                    'border-2 border-border bg-surface shadow-md'
                  }
                >
                  {suggestions.map((city, index) => (
                    <li
                      key={`${city.name}-${city.province}`}
                      id={`compat-city-option-${index}`}
                      role="option"
                      aria-selected={selectedCity?.name === city.name}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        selectCity(city)
                      }}
                      className={`px-3 py-2 cursor-pointer text-sm font-body ${
                        index === activeIndex
                          ? 'bg-accent-soft text-accent-fg'
                          : 'text-fg'
                      }`}
                    >
                      <span className="font-mono">{city.name}</span>
                      <span className="text-muted ml-2">— {city.province}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {errors.city ? (
              <p className={errorClass} role="alert">
                {errors.city}
              </p>
            ) : (
              <p id="compat-city-hint" className={hintClass}>
                {getCities().length} kota/kabupaten Indonesia. Gunakan panah ↑↓ untuk navigasi.
              </p>
            )}
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full">
            Hitung Kecocokan
          </Button>
        </form>
      </Card>

      {result ? (
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
      ) : null}
    </div>
  )
}