import { useSettingsStore } from '@/stores/settingsStore'
import { useEffect } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const darkMode = useSettingsStore((state) => state.ui.darkMode)
  const saveSettings = useSettingsStore((state) => state.saveSettings)

  const theme: Theme = darkMode ? 'dark' : 'light'

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    // Keep legacy localStorage in sync for compatibility
    localStorage.setItem('theme', theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    saveSettings({ ui: { darkMode: newTheme === 'dark' } })
  }

  const toggleTheme = () => {
    saveSettings({ ui: { darkMode: !darkMode } })
  }

  return { theme, setTheme, toggleTheme }
}
