import type { App, CreateAppInput, UpdateAppInput } from '@/schemas/app.schema'
import { appsService } from '@/services/apps.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const appsKeys = {
  all: ['apps'] as const,
  detail: (id: string) => ['apps', id] as const,
}

export function useApps() {
  return useQuery({
    queryKey: appsKeys.all,
    queryFn: appsService.getAll,
  })
}

export function useApp(id: string) {
  return useQuery({
    queryKey: appsKeys.detail(id),
    queryFn: () => appsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAppInput) => appsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appsKeys.all })
    },
  })
}

export function useUpdateApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppInput }) =>
      appsService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: appsKeys.all })
      await queryClient.cancelQueries({ queryKey: appsKeys.detail(id) })

      // Snapshot the previous value
      const previousApps = queryClient.getQueryData(appsKeys.all)
      const previousApp = queryClient.getQueryData(appsKeys.detail(id))

      // Optimistically update the cache
      queryClient.setQueryData(appsKeys.all, (old: App[] | undefined) =>
        old?.map((a) => (a.appId === id ? { ...a, ...data } : a))
      )
      queryClient.setQueryData(appsKeys.detail(id), (old: App | undefined) =>
        old ? { ...old, ...data } : old
      )

      return { previousApps, previousApp, id }
    },
    onError: (_, { id }, context) => {
      // Rollback on error
      if (context?.previousApps) {
        queryClient.setQueryData(appsKeys.all, context.previousApps)
      }
      if (context?.previousApp) {
        queryClient.setQueryData(appsKeys.detail(id), context.previousApp)
      }
    },
    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: appsKeys.all })
      queryClient.invalidateQueries({ queryKey: appsKeys.detail(id) })
    },
  })
}

export function useDeleteApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appsKeys.all })
    },
  })
}
