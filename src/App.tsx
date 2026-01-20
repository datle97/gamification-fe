import { AuthGuard, ThemeProvider } from '@/components/common'
import { MainLayout } from '@/components/layouts'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/login').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() =>
  import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage }))
)
const GamesPage = lazy(() => import('@/pages/games').then((m) => ({ default: m.GamesPage })))
const GameDetailPage = lazy(() =>
  import('@/pages/games').then((m) => ({ default: m.GameDetailPage }))
)
const UserDetailPage = lazy(() =>
  import('@/pages/games').then((m) => ({ default: m.UserDetailPage }))
)
const AppsPage = lazy(() => import('@/pages/apps').then((m) => ({ default: m.AppsPage })))
const AppGamesPage = lazy(() =>
  import('@/pages/app-games').then((m) => ({ default: m.AppGamesPage }))
)
const SettingsPage = lazy(() =>
  import('@/pages/settings').then((m) => ({ default: m.SettingsPage }))
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Toaster position="bottom-left" />
        <HashRouter>
          <Suspense>
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route element={<AuthGuard />}>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Main layout wrapper */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/games/:gameId" element={<GameDetailPage />} />
                <Route path="/games/:gameId/users/:userId" element={<UserDetailPage />} />
                <Route path="/apps" element={<AppsPage />} />
                <Route path="/app-games" element={<AppGamesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            </Routes>
          </Suspense>
        </HashRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
