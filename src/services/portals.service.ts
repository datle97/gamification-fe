import { api } from '@/lib/api'
import type { CreatePortalInput, Portal, UpdatePortalInput } from '@/schemas/portal.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const portalsService = {
  getAll: () =>
    api
      .get('gamification/admin/portals')
      .json<ApiResponse<Portal[]>>()
      .then((res) => res.data),

  getById: (id: number) =>
    api
      .get(`gamification/admin/portals/${id}`)
      .json<ApiResponse<Portal>>()
      .then((res) => res.data),

  create: (data: CreatePortalInput) =>
    api
      .post('gamification/admin/portals', { json: data })
      .json<ApiResponse<Portal>>()
      .then((res) => res.data),

  update: (id: number, data: UpdatePortalInput) =>
    api
      .put(`gamification/admin/portals/${id}`, { json: data })
      .json<ApiResponse<Portal>>()
      .then((res) => res.data),

  delete: (id: number) => api.delete(`gamification/admin/portals/${id}`),
}
