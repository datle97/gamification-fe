import { api } from '@/lib/api'
import type { Mission, CreateMissionInput, UpdateMissionInput } from '@/schemas/mission.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const missionsService = {
  getAll: () =>
    api
      .get('internal/gamification/missions')
      .json<ApiResponse<Mission[]>>()
      .then((res) => res.data),

  getByGameId: (gameId: string) =>
    api
      .get('internal/gamification/missions', { searchParams: { gameId } })
      .json<ApiResponse<Mission[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`internal/gamification/missions/${id}`)
      .json<ApiResponse<Mission>>()
      .then((res) => res.data),

  create: (data: CreateMissionInput) =>
    api
      .post('internal/gamification/missions', { json: data })
      .json<ApiResponse<Mission>>()
      .then((res) => res.data),

  update: (id: string, data: UpdateMissionInput) =>
    api
      .put(`internal/gamification/missions/${id}`, { json: data })
      .json<ApiResponse<Mission>>()
      .then((res) => res.data),

  delete: (id: string) => api.delete(`internal/gamification/missions/${id}`),
}
