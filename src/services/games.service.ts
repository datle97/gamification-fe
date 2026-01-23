import { api } from '@/lib/api'
import type { GameExport } from '@/lib/game-export'
import type { CloneGameInput, CreateGameInput, Game, UpdateGameInput } from '@/schemas/game.schema'
import type { HistoricalPeriods, LeaderboardResponse } from '@/schemas/leaderboard.schema'

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

  export: (id: string) =>
    api
      .get(`gamification/admin/games/${id}/export`)
      .json<ApiResponse<GameExport>>()
      .then((res) => res.data),

  import: (data: GameExport, options?: ImportOptions) =>
    api
      .post('gamification/admin/games/import', { json: { ...data, options } })
      .json<ApiResponse<ImportGameResult>>()
      .then((res) => res.data),

  preview: (data: GameExport) =>
    api
      .post('gamification/admin/games/import/preview', { json: data })
      .json<ApiResponse<PreviewImportResult>>()
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

  // Dashboard stats (aggregated endpoint with caching)
  getDashboardStats: () =>
    api
      .get('gamification/admin/dashboard/stats')
      .json<ApiResponse<DashboardStats>>()
      .then((res) => res.data),
}

// Dashboard stats types
export interface DashboardGameStats {
  gameId: string
  code: string
  name: string
  type: string
  status: string
  totalUsers: number
  activeToday: number
  activeLast7Days: number
  isActive: boolean
}

export interface DashboardRecentWinner {
  gameId: string
  gameName: string
  gameCode: string
  userId: string
  userName: string | null
  score: number
  period: string
  periodType: string
}

export interface DashboardRewardDistributionItem {
  gameId: string
  gameName: string
  gameCode: string
  count: number
  quota: number | null
  quotaUsage: number | null
}

export interface DashboardRewardsDistribution {
  totalDistributed: number
  byGame: DashboardRewardDistributionItem[]
}

export interface DashboardStats {
  totalGames: number
  activeGames: number
  totalApps: number
  totalUsers: number
  activeUsersToday: number
  activeUsersLast7Days: number
  topGames: DashboardGameStats[]
  recentWinners: DashboardRecentWinner[]
  rewardsDistribution: DashboardRewardsDistribution
}

// Import result type
export interface ImportGameResult {
  game: {
    gameId: string
    action: 'created' | 'updated'
  }
  missions: {
    created: number
    updated: number
  }
  rewards: {
    created: number
    updated: number
  }
}

// Import preview types
export interface ImportOptions {
  /** Selective import options - if not provided, import all */
  include?: {
    game?: boolean
    missions?: boolean
    rewards?: boolean
  }
}

export interface ItemDiff {
  id: string
  code?: string
  name: string
  action: 'create' | 'update' | 'skip'
  /** Changed fields for update action */
  changes?: Array<{
    field: string
    oldValue: unknown
    newValue: unknown
  }>
}

export interface PreviewImportResult {
  game: ItemDiff
  missions: ItemDiff[]
  rewards: ItemDiff[]
  summary: {
    game: { action: 'create' | 'update' | 'skip' }
    missions: { create: number; update: number; skip: number }
    rewards: { create: number; update: number; skip: number }
  }
}
