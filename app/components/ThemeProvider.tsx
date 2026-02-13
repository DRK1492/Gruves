'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ThemeMode = 'dark' | 'light'
export type ThemeName = 'ember' | 'ocean' | 'forest'

interface ThemeContextValue {
  mode: ThemeMode
  theme: ThemeName
  setMode: (mode: ThemeMode) => void
  setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const MODE_STORAGE_KEY = 'gt-theme-mode'
const THEME_STORAGE_KEY = 'gt-theme-name'

const applyTheme = (mode: ThemeMode, theme: ThemeName) => {
  const root = document.documentElement
  root.dataset.mode = mode
  root.dataset.theme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark'
    return (localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode | null) ?? 'dark'
  })
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') return 'ember'
    return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null) ?? 'ember'
  })

  useEffect(() => {
    applyTheme(mode, theme)
    localStorage.setItem(MODE_STORAGE_KEY, mode)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    window.dispatchEvent(new Event('gt-theme-change'))
  }, [mode, theme])

  const value = useMemo(
    () => ({
      mode,
      theme,
      setMode,
      setTheme
    }),
    [mode, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
