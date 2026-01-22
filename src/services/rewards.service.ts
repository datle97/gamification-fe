import { api } from '@/lib/api'
import type {
  CreateRewardInput,
  Reward,
  RewardDistribution,
  UpdateRewardInput,
} from '@/schemas/reward.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const rewardsService = {
  getAll: () =>
    api
      .get('gamification/admin/rewards')
      .json<ApiResponse<Reward[]>>()
      .then((res) => res.data),

  getByGameId: (gameId: string) =>
    api
      .get('gamification/admin/rewards', { searchParams: { gameId } })
      .json<ApiResponse<Reward[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`gamification/admin/rewards/${id}`)
      .json<ApiResponse<Reward>>()
      .then((res) => res.data),

  create: async (data: CreateRewardInput) => {
    const { gameId, ...rest } = data
    const res = await api
      .post(`gamification/admin/games/${gameId}/rewards`, { json: rest })
      .json<ApiResponse<Reward>>()
    return res.data
  },

  update: (gameId: string, id: string, data: UpdateRewardInput) =>
    api
      .put(`gamification/admin/games/${gameId}/rewards/${id}`, { json: data })
      .json<ApiResponse<Reward>>()
      .then((res) => res.data),

  batchUpdate: (gameId: string, updates: Array<{ rewardId: string; data: Partial<Reward> }>) =>
    api
      .post(`gamification/admin/games/${gameId}/rewards/batch-update`, { json: { updates } })
      .json<ApiResponse<void>>(),

  delete: (gameId: string, id: string) =>
    api.delete(`gamification/admin/games/${gameId}/rewards/${id}`),

  getDistribution: (gameId: string) =>
    api
      .get(`gamification/admin/games/${gameId}/rewards/distribution`)
      .json<ApiResponse<RewardDistribution[]>>()
      .then((res) => res.data),
}
