import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'akasha-theme'

type Theme = 'dark' | 'light'

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'light') root.classList.add('light')
  else root.classList.remove('light')
}

export interface UseDarkMode {
  isDark: boolean
  toggle: () => void
}

export function useDarkMode(): UseDarkMode {
  const [theme, setTheme] = useState<Theme>(readInitial)

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return { isDark: theme === 'dark', toggle }
}
