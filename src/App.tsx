import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { queryClient } from '@/lib/query-client'
import { MainLayout } from '@/components/layouts'
import { DashboardPage } from '@/pages/dashboard'
import { GamesPage, GameDetailPage } from '@/pages/games'
import { AppsPage } from '@/pages/apps'
import { AppGamesPage } from '@/pages/app-games'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Main layout wrapper */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/:gameId" element={<GameDetailPage />} />
            <Route path="/apps" element={<AppsPage />} />
            <Route path="/app-games" element={<AppGamesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
