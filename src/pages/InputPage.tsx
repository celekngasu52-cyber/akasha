// src/pages/InputPage.tsx — birth data input form.
//
// Form: native date/time inputs, searchable city combobox (WAI-ARIA pattern),
// "waktu perkiraan" checkbox, submit. On valid submit, calls onSubmit with a
// BirthData object matching src/core/birth/types.ts.
//
// Styling: Tailwind v4 utilities mapped to --aka-* tokens (see src/theme.css).
// Combobox follows the WAI-ARIA combobox pattern: input[role=combobox] +
// ul[role=listbox] with li[role=option], keyboard nav (ArrowUp/Down/Enter/Esc).

import { useState, useRef, useMemo, useCallback, type KeyboardEvent, type ReactNode } from 'react'
import { Button, Card } from '../components/ui'
import type { BirthData } from '../core/birth/types'
import {
  getCities,
  validateDate,
  validateTime,
  MAX_SUGGESTIONS,
  MIN_YEAR,
  MAX_YEAR,
  type CityEntry,
} from './input-utils'

export interface InputPageProps {
  /** Called with validated BirthData when the form is submitted. */
  onSubmit: (data: BirthData) => void
}

export function InputPage({ onSubmit }: InputPageProps): ReactNode {
  const [dateISO, setDateISO] = useState('')
  const [timeISO, setTimeISO] = useState('')
  const [isTimeEstimated, setIsTimeEstimated] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<CityEntry | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [gender, setGender] = useState<'male' | 'female' | ''>('')

  // Combobox state
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  // Filtered suggestions
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return getCities().slice(0, MAX_SUGGESTIONS)
    return getCities()
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.province.toLowerCase().includes(q),
      )
      .slice(0, MAX_SUGGESTIONS)
  }, [query])

  const handleSelectCity = useCallback((city: CityEntry) => {
    setSelectedCity(city)
    setQuery(city.name)
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  const handleInputFocus = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value)
      setSelectedCity(null)
      setIsOpen(true)
      setActiveIndex(e.target.value ? 0 : -1)
    },
    [],
  )

  const handleInputBlur = useCallback(() => {
    // Delay to allow click on option to register
    setTimeout(() => {
      setIsOpen(false)
      // If query matches a city name exactly, select it
      if (query) {
        const match = getCities().find((c) => c.name.toLowerCase() === query.toLowerCase())
        if (match) setSelectedCity(match)
      }
    }, 150)
  }, [query])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
        setIsOpen(true)
        setActiveIndex(0)
        e.preventDefault()
        return
      }
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => {
            const next = prev + 1
            return next >= suggestions.length ? suggestions.length - 1 : next
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev <= 0 ? 0 : prev - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            handleSelectCity(suggestions[activeIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setActiveIndex(-1)
          break
        case 'Tab':
          setIsOpen(false)
          break
      }
    },
    [isOpen, suggestions, activeIndex, handleSelectCity],
  )

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
        <div className="mb-4">
          <label htmlFor="city-combobox" className={labelClass}>
            Kota / Kabupaten Tempat Lahir
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              id="city-combobox"
              type="text"
              role="combobox"
              aria-expanded={isOpen}
              aria-controls="city-listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                isOpen && activeIndex >= 0 ? `city-option-${activeIndex}` : undefined
              }
              aria-describedby="city-combobox-hint"
              aria-invalid={!!errors.city}
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="Ketik nama kota atau kabupaten..."
              autoComplete="off"
              className={inputClass}
            />
            {isOpen && suggestions.length > 0 && (
              <ul
                ref={listboxRef}
                id="city-listbox"
                role="listbox"
                className={[
                  'absolute z-10 left-0 right-0 max-h-60 overflow-auto',
                  'mt-1 rounded-sm border-2 border-border bg-surface shadow-lg',
                ].join(' ')}
              >
                {suggestions.map((city, index) => (
                  <li
                    key={`${city.name}-${city.province}`}
                    id={`city-option-${index}`}
                    role="option"
                    aria-selected={selectedCity?.name === city.name}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelectCity(city)
                    }}
                    className={`px-3 py-2 cursor-pointer text-sm font-body ${
                      index === activeIndex ? 'bg-accent-soft text-accent-fg' : 'text-fg'
                    }`}
                  >
                    <span className="font-mono">{city.name}</span>
                    <span className="text-muted ml-2">— {city.province}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.city ? (
            <p id="city-error" className={errorClass} role="alert">
              {errors.city}
            </p>
          ) : (
            <p id="city-combobox-hint" className={hintClass}>
              {getCities().length} kota/kabupaten Indonesia. Gunakan panah ↑↓ untuk navigasi.
            </p>
          )}
        </div>

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
