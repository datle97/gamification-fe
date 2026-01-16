import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { queryClient } from '@/lib/query-client'
import { MainLayout } from '@/components/layouts'
import { AuthGuard, ThemeProvider } from '@/components/common'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { GamesPage, GameDetailPage, UserDetailPage } from '@/pages/games'
import { AppsPage } from '@/pages/apps'
import { AppGamesPage } from '@/pages/app-games'
import { SettingsPage } from '@/pages/settings'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
