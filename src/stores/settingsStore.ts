import { create, type StateCreator } from 'zustand'
import { persist, createJSONStorage, type PersistOptions } from 'zustand/middleware'

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
export type AutoRefreshInterval = 0 | 30 | 60 | 120 | 300 // 0 = disabled, seconds

interface SettingsState {
  // Feature flags
  features: {
    devMode: boolean // grant turns, reset missions, revoke rewards
    analytics: boolean // charts, heavy queries
  }

  // UI preferences
  ui: {
    darkMode: boolean
    compactTables: boolean
    dateFormat: DateFormat
    autoRefreshInterval: AutoRefreshInterval
    tablePageSize: number // 10, 25, 50, 100
  }

  // Actions
  saveSettings: (settings: {
    features?: Partial<SettingsState['features']>
    ui?: Partial<SettingsState['ui']>
  }) => void
  resetSettings: () => void
}

// Default values based on environment
export const getDefaultFeatures = () => ({
  devMode:
    import.meta.env.VITE_DEV_MODE === 'true' ||
    (import.meta.env.VITE_DEV_MODE !== 'false' && import.meta.env.VITE_ENV !== 'production'),
  analytics:
    import.meta.env.VITE_ANALYTICS === 'true' ||
    (import.meta.env.VITE_ANALYTICS !== 'false' && import.meta.env.VITE_ENV !== 'production'),
})

export const getDefaultUI = () => ({
  darkMode: localStorage.getItem('theme') !== 'light',
  compactTables: false,
  dateFormat: 'DD/MM/YYYY' as DateFormat,
  autoRefreshInterval: 0 as AutoRefreshInterval,
  tablePageSize: 25,
})

const defaultSettings = {
  features: getDefaultFeatures(),
  ui: getDefaultUI(),
}

type SettingsPersistedState = Pick<SettingsState, 'features' | 'ui'>

const persistOptions: PersistOptions<SettingsState, SettingsPersistedState> = {
  name: 'gamification-admin-settings',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    features: state.features,
    ui: state.ui,
  }),
}

const storeCreator: StateCreator<SettingsState> = (set) => ({
  ...defaultSettings,

  saveSettings: (settings) =>
    set((state) => ({
      features: settings.features ? { ...state.features, ...settings.features } : state.features,
      ui: settings.ui ? { ...state.ui, ...settings.ui } : state.ui,
    })),

  resetSettings: () => set(defaultSettings),
})

export const useSettingsStore = create<SettingsState>()(
  persist(storeCreator, persistOptions) as StateCreator<SettingsState>
)

// Selector hooks for convenience
export const useDevMode = () => {
  const fromSettings = useSettingsStore((state) => state.features.devMode)
  // Never allow on production, regardless of settings
  if (import.meta.env.VITE_ENV === 'production') return false
  return fromSettings
}

export const useAnalytics = () => {
  const fromSettings = useSettingsStore((state) => state.features.analytics)
  // Never allow on production, regardless of settings
  if (import.meta.env.VITE_ENV === 'production') return false
  return fromSettings
}

export const useTablePageSize = () => useSettingsStore((state) => state.ui.tablePageSize)

export const useDarkMode = () => useSettingsStore((state) => state.ui.darkMode)

export const useCompactTables = () => useSettingsStore((state) => state.ui.compactTables)

export const useDateFormat = () => useSettingsStore((state) => state.ui.dateFormat)

export const useAutoRefreshInterval = () => useSettingsStore((state) => state.ui.autoRefreshInterval)
