import { api } from '@/lib/api'
import type { Mission, CreateMissionInput, UpdateMissionInput } from '@/schemas/mission.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const missionsService = {
  getAll: () =>
    api
      .get('gamification/admin/missions')
      .json<ApiResponse<Mission[]>>()
      .then((res) => res.data),

  getByGameId: (gameId: string) =>
    api
      .get('gamification/admin/missions', { searchParams: { gameId } })
      .json<ApiResponse<Mission[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`gamification/admin/missions/${id}`)
      .json<ApiResponse<Mission>>()
      .then((res) => res.data),

  create: async (data: CreateMissionInput) => {
    const { gameId, ...rest } = data
    const res = await api
      .post(`gamification/admin/games/${gameId}/missions`, { json: rest })
      .json<ApiResponse<Mission>>()
    return res.data
  },

  update: (id: string, data: UpdateMissionInput) =>
    api
      .put(`gamification/admin/missions/${id}`, { json: data })
      .json<ApiResponse<Mission>>()
      .then((res) => res.data),

  delete: (id: string) => api.delete(`gamification/admin/missions/${id}`),
}
