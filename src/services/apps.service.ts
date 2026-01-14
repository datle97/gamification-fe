import { api } from '@/lib/api'
import type { App, CreateAppInput, UpdateAppInput } from '@/schemas/app.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const appsService = {
  getAll: () =>
    api
      .get('internal/gamification/apps')
      .json<ApiResponse<App[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`internal/gamification/apps/${id}`)
      .json<ApiResponse<App>>()
      .then((res) => res.data),

  create: (data: CreateAppInput) =>
    api
      .post('internal/gamification/apps', { json: data })
      .json<ApiResponse<App>>()
      .then((res) => res.data),

  update: (id: string, data: UpdateAppInput) =>
    api
      .put(`internal/gamification/apps/${id}`, { json: data })
      .json<ApiResponse<App>>()
      .then((res) => res.data),

  delete: (id: string) => api.delete(`internal/gamification/apps/${id}`),
}
