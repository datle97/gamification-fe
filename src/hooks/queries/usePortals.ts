import type { CreatePortalInput, Portal, UpdatePortalInput } from '@/schemas/portal.schema'
import { portalsService } from '@/services/portals.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const portalsKeys = {
  all: ['portals'] as const,
  detail: (id: number) => ['portals', id] as const,
}

export function usePortals() {
  return useQuery({
    queryKey: portalsKeys.all,
    queryFn: portalsService.getAll,
  })
}

export function usePortal(id: number) {
  return useQuery({
    queryKey: portalsKeys.detail(id),
    queryFn: () => portalsService.getById(id),
    enabled: !!id,
  })
}

export function useCreatePortal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePortalInput) => portalsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalsKeys.all })
    },
  })
}

export function useUpdatePortal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePortalInput }) =>
      portalsService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: portalsKeys.all })

      const previousPortals = queryClient.getQueryData(portalsKeys.all)

      queryClient.setQueryData(portalsKeys.all, (old: Portal[] | undefined) =>
        old?.map((p) => (p.portalId === id ? { ...p, ...data } : p))
      )

      return { previousPortals, id }
    },
    onError: (_, __, context) => {
      if (context?.previousPortals) {
        queryClient.setQueryData(portalsKeys.all, context.previousPortals)
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: portalsKeys.all })
      queryClient.invalidateQueries({ queryKey: portalsKeys.detail(id) })
    },
  })
}

export function useDeletePortal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => portalsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalsKeys.all })
    },
  })
}
