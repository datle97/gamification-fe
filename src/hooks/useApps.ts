import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appsService } from '@/services/apps.service'
import type { CreateAppInput, UpdateAppInput } from '@/schemas/app.schema'

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
    onSuccess: (_, { id }) => {
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
