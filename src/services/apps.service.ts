import { api } from '@/lib/api'
import type { App, CreateAppInput, UpdateAppInput } from '@/schemas/app.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const appsService = {
  getAll: () =>
    api
      .get('gamification/admin/apps')
      .json<ApiResponse<App[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`gamification/admin/apps/${id}`)
      .json<ApiResponse<App>>()
      .then((res) => res.data),

  create: (data: CreateAppInput) =>
    api
      .post('gamification/admin/apps', { json: data })
      .json<ApiResponse<App>>()
      .then((res) => res.data),

  update: (id: string, data: UpdateAppInput) =>
    api
      .put(`gamification/admin/apps/${id}`, { json: data })
      .json<ApiResponse<App>>()
      .then((res) => res.data),

  delete: (id: string) => api.delete(`gamification/admin/apps/${id}`),
}
