import { create, type StateCreator } from 'zustand'
import { persist, createJSONStorage, type PersistOptions } from 'zustand/middleware'

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
export type AutoRefreshInterval = 0 | 30 | 60 | 120 | 300 // 0 = disabled, seconds

interface SettingsState {
  // Feature flags
  features: {
    adminTestingTools: boolean // grant turns, reset missions, revoke rewards
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
  adminTestingTools: import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_FEATURES === 'true',
})

export const getDefaultUI = () => ({
  darkMode: localStorage.getItem('theme') === 'dark',
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
export const useAdminTestingTools = () =>
  useSettingsStore((state) => state.features.adminTestingTools)

export const useTablePageSize = () => useSettingsStore((state) => state.ui.tablePageSize)

export const useDarkMode = () => useSettingsStore((state) => state.ui.darkMode)

export const useCompactTables = () => useSettingsStore((state) => state.ui.compactTables)

export const useDateFormat = () => useSettingsStore((state) => state.ui.dateFormat)

export const useAutoRefreshInterval = () => useSettingsStore((state) => state.ui.autoRefreshInterval)
