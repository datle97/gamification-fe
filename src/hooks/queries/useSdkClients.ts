import type {
  CreateSdkClientInput,
  SdkClient,
  UpdateSdkClientInput,
} from '@/schemas/sdkClient.schema'
import { sdkClientsService } from '@/services/sdk-clients.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const sdkClientsKeys = {
  all: ['sdk-clients'] as const,
  detail: (id: string) => ['sdk-clients', id] as const,
}

export function useSdkClients() {
  return useQuery({
    queryKey: sdkClientsKeys.all,
    queryFn: sdkClientsService.getAll,
  })
}

export function useSdkClient(id: string) {
  return useQuery({
    queryKey: sdkClientsKeys.detail(id),
    queryFn: () => sdkClientsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateSdkClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSdkClientInput) => sdkClientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sdkClientsKeys.all })
    },
  })
}

export function useUpdateSdkClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSdkClientInput }) =>
      sdkClientsService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: sdkClientsKeys.all })
      await queryClient.cancelQueries({ queryKey: sdkClientsKeys.detail(id) })

      const previousClients = queryClient.getQueryData(sdkClientsKeys.all)
      const previousClient = queryClient.getQueryData(sdkClientsKeys.detail(id))

      queryClient.setQueryData(sdkClientsKeys.all, (old: SdkClient[] | undefined) =>
        old?.map((c) => (c.clientId === id ? { ...c, ...data } : c))
      )
      queryClient.setQueryData(sdkClientsKeys.detail(id), (old: SdkClient | undefined) =>
        old ? { ...old, ...data } : old
      )

      return { previousClients, previousClient, id }
    },
    onError: (_, { id }, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(sdkClientsKeys.all, context.previousClients)
      }
      if (context?.previousClient) {
        queryClient.setQueryData(sdkClientsKeys.detail(id), context.previousClient)
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: sdkClientsKeys.all })
      queryClient.invalidateQueries({ queryKey: sdkClientsKeys.detail(id) })
    },
  })
}

export function useDeleteSdkClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sdkClientsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sdkClientsKeys.all })
    },
  })
}

export function useRotateSdkClientApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sdkClientsService.rotateApiKey(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: sdkClientsKeys.all })
      queryClient.invalidateQueries({ queryKey: sdkClientsKeys.detail(id) })
    },
  })
}
