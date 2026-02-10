import { api } from '@/lib/api'
import type {
  CreateApiKeyInput,
  ApiKey,
  ApiKeyWithRawKey,
  UpdateApiKeyInput,
} from '@/schemas/apiKey.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const apiKeysService = {
  getAll: () =>
    api
      .get('gamification/admin/api-keys')
      .json<ApiResponse<ApiKey[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`gamification/admin/api-keys/${id}`)
      .json<ApiResponse<ApiKey>>()
      .then((res) => res.data),

  create: (data: CreateApiKeyInput) =>
    api
      .post('gamification/admin/api-keys', { json: data })
      .json<ApiResponse<ApiKeyWithRawKey>>()
      .then((res) => res.data),

  update: (id: string, data: UpdateApiKeyInput) =>
    api
      .put(`gamification/admin/api-keys/${id}`, { json: data })
      .json<ApiResponse<ApiKey>>()
      .then((res) => res.data),

  delete: (id: string) => api.delete(`gamification/admin/api-keys/${id}`),

  rotateApiKey: (id: string) =>
    api
      .post(`gamification/admin/api-keys/${id}/rotate`)
      .json<ApiResponse<{ apiKey: string }>>()
      .then((res) => res.data),
}
