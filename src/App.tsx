import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { queryClient } from '@/lib/query-client'
import { MainLayout } from '@/components/layouts'
import { GamesPage, GameFormPage } from '@/pages/games'
import { AppsPage, AppFormPage } from '@/pages/apps'
import { AppGamesPage, AppGameFormPage } from '@/pages/app-games'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to games */}
          <Route path="/" element={<Navigate to="/games" replace />} />

          {/* Main layout wrapper */}
          <Route element={<MainLayout />}>
            {/* Games */}
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/new" element={<GameFormPage />} />
            <Route path="/games/:id" element={<GameFormPage />} />

            {/* Apps */}
            <Route path="/apps" element={<AppsPage />} />
            <Route path="/apps/new" element={<AppFormPage />} />
            <Route path="/apps/:id" element={<AppFormPage />} />

            {/* App Games */}
            <Route path="/app-games" element={<AppGamesPage />} />
            <Route path="/app-games/new" element={<AppGameFormPage />} />
            <Route path="/app-games/:appId/:gameId" element={<AppGameFormPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
