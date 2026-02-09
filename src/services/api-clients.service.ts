import { api } from '@/lib/api'
import type {
  CreateApiClientInput,
  ApiClient,
  ApiClientWithApiKey,
  UpdateApiClientInput,
} from '@/schemas/apiClient.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const apiClientsService = {
  getAll: () =>
    api
      .get('gamification/admin/api-clients')
      .json<ApiResponse<ApiClient[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`gamification/admin/api-clients/${id}`)
      .json<ApiResponse<ApiClient>>()
      .then((res) => res.data),

  create: (data: CreateApiClientInput) =>
    api
      .post('gamification/admin/api-clients', { json: data })
      .json<ApiResponse<ApiClientWithApiKey>>()
      .then((res) => res.data),

  update: (id: string, data: UpdateApiClientInput) =>
    api
      .put(`gamification/admin/api-clients/${id}`, { json: data })
      .json<ApiResponse<ApiClient>>()
      .then((res) => res.data),

  delete: (id: string) => api.delete(`gamification/admin/api-clients/${id}`),

  rotateApiKey: (id: string) =>
    api
      .post(`gamification/admin/api-clients/${id}/rotate-key`)
      .json<ApiResponse<{ apiKey: string }>>()
      .then((res) => res.data),
}
