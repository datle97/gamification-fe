import { api } from '@/lib/api'
import type { Game, CreateGameInput, UpdateGameInput } from '@/schemas/game.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const gamesService = {
  getAll: () =>
    api
      .get('internal/gamification/games')
      .json<ApiResponse<Game[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`internal/gamification/games/${id}`)
      .json<ApiResponse<Game>>()
      .then((res) => res.data),

  create: (data: CreateGameInput) =>
    api
      .post('internal/gamification/games', { json: data })
      .json<ApiResponse<Game>>()
      .then((res) => res.data),

  update: (id: string, data: UpdateGameInput) =>
    api
      .put(`internal/gamification/games/${id}`, { json: data })
      .json<ApiResponse<Game>>()
      .then((res) => res.data),

  delete: (id: string) => api.delete(`internal/gamification/games/${id}`),
}
