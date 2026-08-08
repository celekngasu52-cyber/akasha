// src/pages/input/CityCombobox.tsx — searchable city combobox (WAI-ARIA).
//
// Extracted from InputPage.tsx as a mechanical split (todo 1 F2 debt).
// Implements the WAI-ARIA combobox pattern: input[role=combobox] +
// ul[role=listbox] with li[role=option], keyboard nav (ArrowUp/Down/Enter/Esc).
// Owns its own open/active-index/query state; the parent owns the selected
// city (passed back via onSelectCity).

import {
  useState,
  useRef,
  useMemo,
  useCallback,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  getCities,
  MAX_SUGGESTIONS,
  type CityEntry,
} from '../input-utils'

export interface CityComboboxProps {
  /** Currently selected city (null until the user picks one). */
  selectedCity: CityEntry | null
  /** Called when the user selects a city from the list. */
  onSelectCity: (city: CityEntry | null) => void
  /** Validation error for the city field, or null/undefined when valid. */
  error?: string
}

const inputClass = [
  'w-full px-3 py-2 rounded-sm border-2 border-border bg-surface',
  'text-fg font-body focus:outline-none focus:border-accent',
].join(' ')
const labelClass = 'block mb-1 text-sm font-mono text-muted'
const errorClass = 'mt-1 text-sm text-danger'
const hintClass = 'mt-1 text-xs text-muted'

export function CityCombobox({
  selectedCity,
  onSelectCity,
  error,
}: CityComboboxProps): ReactNode {
  const [query, setQuery] = useState('')
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
    onSelectCity(city)
    setQuery(city.name)
    setIsOpen(false)
    setActiveIndex(-1)
  }, [onSelectCity])

  const handleInputFocus = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value)
      onSelectCity(null)
      setIsOpen(true)
      setActiveIndex(e.target.value ? 0 : -1)
    },
    [onSelectCity],
  )

  const handleInputBlur = useCallback(() => {
    // Delay to allow click on option to register
    setTimeout(() => {
      setIsOpen(false)
      // If query matches a city name exactly, select it
      if (query) {
        const match = getCities().find((c) => c.name.toLowerCase() === query.toLowerCase())
        if (match) onSelectCity(match)
      }
    }, 150)
  }, [query, onSelectCity])

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

  return (
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
          aria-invalid={!!error}
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
      {error ? (
        <p id="city-error" className={errorClass} role="alert">
          {error}
        </p>
      ) : (
        <p id="city-combobox-hint" className={hintClass}>
          {getCities().length} kota/kabupaten Indonesia. Gunakan panah ↑↓ untuk navigasi.
        </p>
      )}
    </div>
  )
}
