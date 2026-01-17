import { api } from '@/lib/api'
import type { Game, CreateGameInput, UpdateGameInput, CloneGameInput } from '@/schemas/game.schema'
import type {
  LeaderboardResponse,
  HistoricalPeriods,
} from '@/schemas/leaderboard.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const gamesService = {
  getAll: () =>
    api
      .get('gamification/admin/games')
      .json<ApiResponse<Game[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`gamification/admin/games/${id}`)
      .json<ApiResponse<Game>>()
      .then((res) => res.data),

  create: (data: CreateGameInput) =>
    api
      .post('gamification/admin/games', { json: data })
      .json<ApiResponse<Game>>()
      .then((res) => res.data),

  update: (id: string, data: UpdateGameInput) =>
    api
      .put(`gamification/admin/games/${id}`, { json: data })
      .json<ApiResponse<Game>>()
      .then((res) => res.data),

  delete: (id: string) => api.delete(`gamification/admin/games/${id}`),

  clone: (id: string, data: CloneGameInput) =>
    api
      .post(`gamification/admin/games/${id}/clone`, { json: data })
      .json<ApiResponse<Game>>()
      .then((res) => res.data),

  // Stats methods
  getGameStats: (gameId: string) =>
    api
      .get(`gamification/admin/games/${gameId}/stats`)
      .json<
        ApiResponse<{
          totalUsers: number
          activeToday: number
          activeLast7Days: number
        }>
      >()
      .then((res) => res.data),

  // Leaderboard methods
  getLeaderboard: (gameId: string, period?: string) =>
    api
      .get(`gamification/admin/games/${gameId}/leaderboard`, {
        searchParams: period ? { period } : undefined,
      })
      .json<ApiResponse<LeaderboardResponse>>()
      .then((res) => res.data),

  getLeaderboardPeriods: (gameId: string) =>
    api
      .get(`gamification/admin/games/${gameId}/leaderboard/periods`)
      .json<ApiResponse<HistoricalPeriods>>()
      .then((res) => res.data),
}
