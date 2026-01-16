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

  update: (id: string, data: UpdateRewardInput) =>
    api
      .put(`gamification/admin/rewards/${id}`, { json: data })
      .json<ApiResponse<Reward>>()
      .then((res) => res.data),

  batchUpdate: (updates: Array<{ rewardId: string; data: Partial<Reward> }>) =>
    api
      .post('gamification/admin/rewards/batch-update', { json: { updates } })
      .json<ApiResponse<void>>(),

  delete: (id: string) => api.delete(`gamification/admin/rewards/${id}`),

  getDistribution: (gameId: string) =>
    api
      .get(`gamification/admin/games/${gameId}/rewards/distribution`)
      .json<ApiResponse<RewardDistribution[]>>()
      .then((res) => res.data),
}
