import { api } from '@/lib/api'
import type {
  Reward,
  CreateRewardInput,
  UpdateRewardInput,
  RewardDistribution,
} from '@/schemas/reward.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const rewardsService = {
  getAll: () =>
    api
      .get('internal/gamification/rewards')
      .json<ApiResponse<Reward[]>>()
      .then((res) => res.data),

  getByGameId: (gameId: string) =>
    api
      .get('internal/gamification/rewards', { searchParams: { gameId } })
      .json<ApiResponse<Reward[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`internal/gamification/rewards/${id}`)
      .json<ApiResponse<Reward>>()
      .then((res) => res.data),

  create: (data: CreateRewardInput) =>
    api
      .post('internal/gamification/rewards', { json: data })
      .json<ApiResponse<Reward>>()
      .then((res) => res.data),

  update: (id: string, data: UpdateRewardInput) =>
    api
      .put(`internal/gamification/rewards/${id}`, { json: data })
      .json<ApiResponse<Reward>>()
      .then((res) => res.data),

  batchUpdate: (updates: Array<{ rewardId: string; data: Partial<Reward> }>) =>
    api
      .post('internal/gamification/rewards/batch-update', { json: { updates } })
      .json<ApiResponse<void>>(),

  delete: (id: string) => api.delete(`internal/gamification/rewards/${id}`),

  getDistribution: (gameId: string) =>
    api
      .get(`internal/gamification/games/${gameId}/rewards/distribution`)
      .json<ApiResponse<RewardDistribution[]>>()
      .then((res) => res.data),
}
