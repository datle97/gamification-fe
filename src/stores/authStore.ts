import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  login: (pin: string) => boolean
  logout: () => void
}

// PIN is stored in env variable - falls back to empty string (no access)
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || ''

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,

      login: (pin: string) => {
        // If no PIN configured, reject all attempts
        if (!ADMIN_PIN) {
          return false
        }
        if (pin === ADMIN_PIN) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },

      logout: () => {
        set({ isAuthenticated: false })
      },
    }),
    {
      name: 'gamification-admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
)

// Selector hooks
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
