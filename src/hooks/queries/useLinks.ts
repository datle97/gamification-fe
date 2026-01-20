import type { CreateLinkInput } from '@/schemas/link.schema'
import { linksService } from '@/services/links.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const linksKeys = {
  all: ['links'] as const,
  filtered: (params?: { appId?: string; gameId?: string }) =>
    params ? (['links', params] as const) : (['links'] as const),
}

export function useLinks(params?: { appId?: string; gameId?: string }) {
  return useQuery({
    queryKey: linksKeys.filtered(params),
    queryFn: () => linksService.getAll(params),
  })
}

export function useCreateLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLinkInput) => linksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linksKeys.all })
    },
  })
}

export function useDeleteLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appId, gameId }: { appId: string; gameId: string }) =>
      linksService.delete(appId, gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linksKeys.all })
    },
  })
}
