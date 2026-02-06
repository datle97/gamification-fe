import { api } from '@/lib/api'
import type {
  CreateSdkClientInput,
  SdkClient,
  SdkClientWithApiKey,
  UpdateSdkClientInput,
} from '@/schemas/sdkClient.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const sdkClientsService = {
  getAll: () =>
    api
      .get('gamification/admin/sdk-clients')
      .json<ApiResponse<SdkClient[]>>()
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get(`gamification/admin/sdk-clients/${id}`)
      .json<ApiResponse<SdkClient>>()
      .then((res) => res.data),

  create: (data: CreateSdkClientInput) =>
    api
      .post('gamification/admin/sdk-clients', { json: data })
      .json<ApiResponse<SdkClientWithApiKey>>()
      .then((res) => res.data),

  update: (id: string, data: UpdateSdkClientInput) =>
    api
      .put(`gamification/admin/sdk-clients/${id}`, { json: data })
      .json<ApiResponse<SdkClient>>()
      .then((res) => res.data),

  delete: (id: string) => api.delete(`gamification/admin/sdk-clients/${id}`),

  rotateApiKey: (id: string) =>
    api
      .post(`gamification/admin/sdk-clients/${id}/rotate-key`)
      .json<ApiResponse<{ apiKey: string }>>()
      .then((res) => res.data),
}
