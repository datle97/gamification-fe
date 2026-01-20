import { useSettingsStore } from '@/stores/settingsStore'
import { useEffect, type ReactNode } from 'react'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const darkMode = useSettingsStore((state) => state.ui.darkMode)

  // Apply theme class to document on mount and when darkMode changes
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(darkMode ? 'dark' : 'light')
  }, [darkMode])

  return <>{children}</>
}
