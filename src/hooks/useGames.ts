import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gamesService } from '@/services/games.service'
import type { CreateGameInput, UpdateGameInput } from '@/schemas/game.schema'

export const gamesKeys = {
  all: ['games'] as const,
  detail: (id: string) => ['games', id] as const,
}

export function useGames() {
  return useQuery({
    queryKey: gamesKeys.all,
    queryFn: gamesService.getAll,
  })
}

export function useGame(id: string) {
  return useQuery({
    queryKey: gamesKeys.detail(id),
    queryFn: () => gamesService.getById(id),
    enabled: !!id,
  })
}

export function useCreateGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateGameInput) => gamesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.all })
    },
  })
}

export function useUpdateGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGameInput }) =>
      gamesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.all })
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(id) })
    },
  })
}

export function useDeleteGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => gamesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.all })
    },
  })
}
