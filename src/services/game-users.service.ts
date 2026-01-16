import { api } from '@/lib/api'

interface ApiResponse<T> {
  data: T
  message?: string
}

export interface GameUser {
  id: string
  userId: string
  gameId: string
  externalUserId?: string
  joinedAt: string
  lastActiveAt: string | null
  attributes: Record<string, any>
  updatedAt: string
  user?: {
    userId: string
    displayName?: string
    avatar?: string
    phone?: string
    source?: string
    createdAt: string
  }
}

export interface GameStats {
  totalUsers: number
  activeToday: number
  activeLast7Days: number
}

export interface ListGameUsersParams {
  gameId: string
  search?: string
  page?: number
  limit?: number
  sortBy?: 'joinedAt' | 'lastActive'
  sortOrder?: 'ASC' | 'DESC'
}

export interface UserTurn {
  turnId: number
  userId: string
  gameId: string
  initialAmount: number
  remainingAmount: number
  expiresAt: string | null
  createdAt: string
}

export interface UserReward {
  id: string
  userId: string
  gameId: string
  rewardId: string
  rewardValue: string | null
  validFrom: string | null
  expiredAt: string | null
  createdAt: string
  reward?: {
    rewardId: string
    name: string
    imageUrl: string | null
    rewardType: string | null
  }
}

// Flat structure matching backend MissionWithProgress
export interface UserMissionProgress {
  missionId: string
  code: string
  name: string
  description: string | null
  targetValue: number
  rewardType: string
  rewardValue: number
  missionPeriod: string
  isActive: boolean
  progress: {
    currentValue: number
    isCompleted: boolean
    completedAt: string | null
    rewardClaimed: boolean
  } | null
}

export interface EligibilityCheckDetail {
  name: string
  passed: boolean
  detail?: Record<string, unknown>
}

export interface RewardEligibilityResult {
  reward: {
    rewardId: string
    name: string
    imageUrl?: string
    probability: number
  }
  isEligible: boolean
  checks: EligibilityCheckDetail[]
}

export interface CheckEligibilityInput {
  clientInput?: Record<string, unknown>
}

export type ExpirationMode = 'permanent' | 'ttl' | 'fixed' | 'anchor'
export type ExpirationUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

export interface ExpirationConfig {
  mode: ExpirationMode
  value?: number
  unit?: ExpirationUnit
  date?: string
}

export interface GrantTurnsInput {
  amount: number
  portalId?: number
  reason?: string
  expirationConfig?: ExpirationConfig
}

export interface GrantTurnsResult {
  turnsGranted: number
  newBalance: number
}

export type ActivityType =
  | 'game_play'
  | 'turn_earn'
  | 'turn_spend'
  | 'turn_expire'
  | 'reward_earn'
  | 'mission_complete'
  | 'score_earn'
  | 'admin_grant'
  | 'admin_revoke'

export interface UserActivity {
  id: string
  type: ActivityType
  timestamp: string
  description: string
  metadata?: {
    rewardName?: string
    rewardId?: string
    missionName?: string
    missionId?: string
    amount?: number
    score?: number
    reason?: string
    sessionId?: string
    requestId?: string
  }
}

export interface UserActivitiesResponse {
  activities: UserActivity[]
  total: number
  hasMore: boolean
}

export const gameUsersService = {
  listByGame: (params: ListGameUsersParams) => {
    const { gameId, ...searchParams } = params
    return api
      .get(`gamification/admin/games/${gameId}/users`, { searchParams })
      .json<ApiResponse<{ data: GameUser[]; total: number }>>()
      .then((res) => res.data)
  },

  getStats: (gameId: string) =>
    api
      .get(`gamification/admin/games/${gameId}/stats`)
      .json<ApiResponse<GameStats>>()
      .then((res) => res.data),

  getDetail: (gameId: string, userId: string) =>
    api
      .get(`gamification/admin/games/${gameId}/users/${userId}`)
      .json<ApiResponse<GameUser>>()
      .then((res) => res.data),

  getTurns: (gameId: string, userId: string) =>
    api
      .get(`gamification/admin/games/${gameId}/users/${userId}/turns`)
      .json<ApiResponse<UserTurn[]>>()
      .then((res) => res.data),

  getRewards: (gameId: string, userId: string, page = 1, limit = 50) =>
    api
      .get(`gamification/admin/games/${gameId}/users/${userId}/rewards`, {
        searchParams: { page: page.toString(), limit: limit.toString() },
      })
      .json<ApiResponse<UserReward[]>>()
      .then((res) => res.data),

  getMissions: (gameId: string, userId: string) =>
    api
      .get(`gamification/admin/games/${gameId}/users/${userId}/missions`)
      .json<ApiResponse<UserMissionProgress[]>>()
      .then((res) => res.data),

  checkEligibility: (gameId: string, userId: string, input?: CheckEligibilityInput) =>
    api
      .post(`gamification/admin/games/${gameId}/users/${userId}/check-eligibility`, {
        json: input || {},
      })
      .json<ApiResponse<RewardEligibilityResult[]>>()
      .then((res) => res.data),

  grantTurns: (gameId: string, userId: string, input: GrantTurnsInput) =>
    api
      .post(`gamification/admin/games/${gameId}/users/${userId}/grant-turns`, {
        json: input,
      })
      .json<ApiResponse<GrantTurnsResult>>()
      .then((res) => res.data),

  resetMissionProgress: (gameId: string, userId: string, missionId: string) =>
    api
      .post(`gamification/admin/games/${gameId}/users/${userId}/missions/${missionId}/reset`)
      .json<ApiResponse<{ reset: boolean }>>()
      .then((res) => res.data),

  resetAllMissionsProgress: (gameId: string, userId: string) =>
    api
      .post(`gamification/admin/games/${gameId}/users/${userId}/missions/reset-all`)
      .json<ApiResponse<{ resetCount: number }>>()
      .then((res) => res.data),

  revokeUserReward: (gameId: string, userId: string, userRewardId: string) =>
    api
      .delete(`gamification/admin/games/${gameId}/users/${userId}/rewards/${userRewardId}`)
      .json<ApiResponse<{ revoked: boolean }>>()
      .then((res) => res.data),

  getActivities: (gameId: string, userId: string, page = 1, limit = 50) =>
    api
      .get(`gamification/admin/games/${gameId}/users/${userId}/activities`, {
        searchParams: { page: page.toString(), limit: limit.toString() },
      })
      .json<ApiResponse<UserActivitiesResponse>>()
      .then((res) => res.data),
}
