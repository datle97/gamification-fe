import type { ApiKey, CreateApiKeyInput, UpdateApiKeyInput } from '@/schemas/apiKey.schema'
import { apiKeysService } from '@/services/api-keys.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const apiKeysKeys = {
  all: ['api-keys'] as const,
  detail: (id: string) => ['api-keys', id] as const,
}

export function useApiKeys() {
  return useQuery({
    queryKey: apiKeysKeys.all,
    queryFn: apiKeysService.getAll,
  })
}

export function useApiKey(id: string) {
  return useQuery({
    queryKey: apiKeysKeys.detail(id),
    queryFn: () => apiKeysService.getById(id),
    enabled: !!id,
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateApiKeyInput) => apiKeysService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.all })
    },
  })
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApiKeyInput }) =>
      apiKeysService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: apiKeysKeys.all })
      await queryClient.cancelQueries({ queryKey: apiKeysKeys.detail(id) })

      const previousKeys = queryClient.getQueryData(apiKeysKeys.all)
      const previousKey = queryClient.getQueryData(apiKeysKeys.detail(id))

      queryClient.setQueryData(apiKeysKeys.all, (old: ApiKey[] | undefined) =>
        old?.map((k) => (k.keyId === id ? { ...k, ...data } : k))
      )
      queryClient.setQueryData(apiKeysKeys.detail(id), (old: ApiKey | undefined) =>
        old ? { ...old, ...data } : old
      )

      return { previousKeys, previousKey, id }
    },
    onError: (_, { id }, context) => {
      if (context?.previousKeys) {
        queryClient.setQueryData(apiKeysKeys.all, context.previousKeys)
      }
      if (context?.previousKey) {
        queryClient.setQueryData(apiKeysKeys.detail(id), context.previousKey)
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.all })
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.detail(id) })
    },
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiKeysService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.all })
    },
  })
}

export function useRotateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiKeysService.rotateApiKey(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.all })
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.detail(id) })
    },
  })
}
