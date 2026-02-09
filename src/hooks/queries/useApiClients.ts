import type {
  CreateApiClientInput,
  ApiClient,
  UpdateApiClientInput,
} from '@/schemas/apiClient.schema'
import { apiClientsService } from '@/services/api-clients.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const apiClientsKeys = {
  all: ['api-clients'] as const,
  detail: (id: string) => ['api-clients', id] as const,
}

export function useApiClients() {
  return useQuery({
    queryKey: apiClientsKeys.all,
    queryFn: apiClientsService.getAll,
  })
}

export function useApiClient(id: string) {
  return useQuery({
    queryKey: apiClientsKeys.detail(id),
    queryFn: () => apiClientsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateApiClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateApiClientInput) => apiClientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiClientsKeys.all })
    },
  })
}

export function useUpdateApiClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApiClientInput }) =>
      apiClientsService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: apiClientsKeys.all })
      await queryClient.cancelQueries({ queryKey: apiClientsKeys.detail(id) })

      const previousClients = queryClient.getQueryData(apiClientsKeys.all)
      const previousClient = queryClient.getQueryData(apiClientsKeys.detail(id))

      queryClient.setQueryData(apiClientsKeys.all, (old: ApiClient[] | undefined) =>
        old?.map((c) => (c.clientId === id ? { ...c, ...data } : c))
      )
      queryClient.setQueryData(apiClientsKeys.detail(id), (old: ApiClient | undefined) =>
        old ? { ...old, ...data } : old
      )

      return { previousClients, previousClient, id }
    },
    onError: (_, { id }, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(apiClientsKeys.all, context.previousClients)
      }
      if (context?.previousClient) {
        queryClient.setQueryData(apiClientsKeys.detail(id), context.previousClient)
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: apiClientsKeys.all })
      queryClient.invalidateQueries({ queryKey: apiClientsKeys.detail(id) })
    },
  })
}

export function useDeleteApiClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClientsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiClientsKeys.all })
    },
  })
}

export function useRotateApiClientApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClientsService.rotateApiKey(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: apiClientsKeys.all })
      queryClient.invalidateQueries({ queryKey: apiClientsKeys.detail(id) })
    },
  })
}
