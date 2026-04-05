'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ThemeMode = 'dark' | 'light'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const MODE_STORAGE_KEY = 'gt-theme-mode'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark'
    return (localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode | null) ?? 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.mode = mode
    localStorage.setItem(MODE_STORAGE_KEY, mode)
    window.dispatchEvent(new Event('gt-theme-change'))
  }, [mode])

  const value = useMemo(() => ({ mode, setMode }), [mode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
