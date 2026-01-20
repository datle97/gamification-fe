import { AuthGuard, ThemeProvider } from '@/components/common'
import { MainLayout } from '@/components/layouts'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { AppGamesPage } from '@/pages/app-games'
import { AppsPage } from '@/pages/apps'
import { DashboardPage } from '@/pages/dashboard'
import { GameDetailPage, GamesPage, UserDetailPage } from '@/pages/games'
import { LoginPage } from '@/pages/login'
import { SettingsPage } from '@/pages/settings'
import { QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Navigate, Route, Routes } from 'react-router'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Toaster position="bottom-left" />
        <HashRouter>
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
        </HashRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
