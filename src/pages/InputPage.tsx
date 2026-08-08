// src/pages/InputPage.tsx — birth data input form.
//
// Form: native date/time inputs, searchable city combobox (WAI-ARIA pattern),
// "waktu perkiraan" checkbox, submit. On valid submit, calls onSubmit with a
// BirthData object matching src/core/birth/types.ts.
//
// Styling: Tailwind v4 utilities mapped to --aka-* tokens (see src/theme.css).
// Combobox follows the WAI-ARIA combobox pattern: input[role=combobox] +
// ul[role=listbox] with li[role=option], keyboard nav (ArrowUp/Down/Enter/Esc).
// The combobox component lives in ./input/CityCombobox.tsx (mechanical split
// of the original InputPage.tsx — todo 1 F2 debt).

import { useState, useCallback, type ReactNode } from 'react'
import { Button, Card } from '../components/ui'
import type { BirthData } from '../core/birth/types'
import {
  validateDate,
  validateTime,
  MIN_YEAR,
  MAX_YEAR,
  type CityEntry,
} from './input-utils'
import { CityCombobox } from './input/CityCombobox'

export interface InputPageProps {
  /** Called with validated BirthData when the form is submitted. */
  onSubmit: (data: BirthData) => void
}

export function InputPage({ onSubmit }: InputPageProps): ReactNode {
  const [dateISO, setDateISO] = useState('')
  const [timeISO, setTimeISO] = useState('')
  const [isTimeEstimated, setIsTimeEstimated] = useState(false)
  const [selectedCity, setSelectedCity] = useState<CityEntry | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [gender, setGender] = useState<'male' | 'female' | ''>('')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const newErrors: Record<string, string> = {}
      const dateErr = validateDate(dateISO)
      if (dateErr) newErrors.dateISO = dateErr
      const timeErr = validateTime(timeISO, isTimeEstimated)
      if (timeErr) newErrors.timeISO = timeErr
      if (!selectedCity) newErrors.city = 'Kota tempat lahir wajib dipilih.'

      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return

      if (!selectedCity) return // type guard

      const birthData: BirthData = {
        dateISO,
        timeISO: isTimeEstimated || !timeISO ? null : timeISO,
        lat: selectedCity.lat,
        lng: selectedCity.lng,
        tzIANA: selectedCity.tzIANA,
        placeName: selectedCity.name,
        isTimeEstimated,
        ...(gender ? { gender } : {}),
      }
      onSubmit(birthData)
    },
    [dateISO, timeISO, isTimeEstimated, selectedCity, gender, onSubmit],
  )

  const inputClass = [
    'w-full px-3 py-2 rounded-sm border-2 border-border bg-surface',
    'text-fg font-body focus:outline-none focus:border-accent',
  ].join(' ')
  const labelClass = 'block mb-1 text-sm font-mono text-muted'
  const errorClass = 'mt-1 text-sm text-danger'
  const hintClass = 'mt-1 text-xs text-muted'

  return (
    <Card className="max-w-xl mx-auto p-6" raised>
      <h2 className="font-display text-2xl mb-4 text-fg">Data Kelahiran</h2>
      <form onSubmit={handleSubmit} noValidate>
        {/* Date */}
        <div className="mb-4">
          <label htmlFor="birth-date" className={labelClass}>
            Tanggal Lahir
          </label>
          <input
            id="birth-date"
            type="date"
            value={dateISO}
            min={`${MIN_YEAR}-01-01`}
            max={`${MAX_YEAR}-12-31`}
            onChange={(e) => setDateISO(e.target.value)}
            aria-describedby="birth-date-hint"
            aria-invalid={!!errors.dateISO}
            className={inputClass}
          />
          {errors.dateISO ? (
            <p id="birth-date-error" className={errorClass} role="alert">
              {errors.dateISO}
            </p>
          ) : (
            <p id="birth-date-hint" className={hintClass}>
              Format: YYYY-MM-DD, rentang {MIN_YEAR}–{MAX_YEAR}.
            </p>
          )}
        </div>

        {/* Time */}
        <div className="mb-4">
          <label htmlFor="birth-time" className={labelClass}>
            Waktu Lahir
          </label>
          <input
            id="birth-time"
            type="time"
            value={timeISO}
            onChange={(e) => setTimeISO(e.target.value)}
            disabled={isTimeEstimated}
            aria-describedby="birth-time-hint"
            aria-invalid={!!errors.timeISO}
            className={`${inputClass} ${isTimeEstimated ? 'opacity-50' : ''}`}
          />
          {errors.timeISO ? (
            <p id="birth-time-error" className={errorClass} role="alert">
              {errors.timeISO}
            </p>
          ) : (
            <p id="birth-time-hint" className={hintClass}>
              Kosongkan jika tidak diketahui lalu centang opsi di bawah.
            </p>
          )}
        </div>

        {/* Time estimated checkbox */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isTimeEstimated}
              onChange={(e) => {
                setIsTimeEstimated(e.target.checked)
                if (e.target.checked) setTimeISO('')
              }}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm font-body text-fg">
              Waktu perkiraan (tidak diketahui pasti)
            </span>
          </label>
        </div>

        {/* City combobox */}
        <CityCombobox
          selectedCity={selectedCity}
          onSelectCity={setSelectedCity}
          error={errors.city}
        />

        {/* Jenis kelamin (opsional, untuk pembacaan gender-dependent) */}
        <div className="mb-4">
          <span className={labelClass}>Jenis Kelamin (opsional)</span>
          <div className="mt-1 flex flex-wrap gap-3">
            {(
              [
                ['male', 'Pria'],
                ['female', 'Perempuan'],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm font-body text-fg"
              >
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={gender === value}
                  onChange={() => setGender(value)}
                  className="h-4 w-4 accent-accent"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" variant="primary" size="lg" className="w-full">
          Hitung
        </Button>
      </form>
    </Card>
  )
}
