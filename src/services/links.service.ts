import { api } from '@/lib/api'
import type { Link, CreateLinkInput } from '@/schemas/link.schema'

interface ApiResponse<T> {
  data: T
  message?: string
}

export const linksService = {
  getAll: (params?: { appId?: string; gameId?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.appId) searchParams.set('appId', params.appId)
    if (params?.gameId) searchParams.set('gameId', params.gameId)

    const query = searchParams.toString()
    return api
      .get(`internal/gamification/links${query ? `?${query}` : ''}`)
      .json<ApiResponse<Link[]>>()
      .then((res) => res.data)
  },

  create: (data: CreateLinkInput) =>
    api
      .post('internal/gamification/links', { json: data })
      .json<ApiResponse<Link>>()
      .then((res) => res.data),

  delete: (appId: string, gameId: string) =>
    api
      .post('internal/gamification/links/delete', { json: { appId, gameId } })
      .json<ApiResponse<{ ok: boolean }>>()
      .then((res) => res.data),
}
