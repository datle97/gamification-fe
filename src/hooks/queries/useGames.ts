import { useRefetchInterval } from '@/hooks/useAutoRefresh'
import type { CloneGameInput, CreateGameInput, Game, UpdateGameInput } from '@/schemas/game.schema'
import { gamesService } from '@/services/games.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const gamesKeys = {
  all: ['games'] as const,
  detail: (id: string) => ['games', id] as const,
  leaderboard: (gameId: string, period?: string) =>
    ['games', gameId, 'leaderboard', period] as const,
  leaderboardPeriods: (gameId: string) => ['games', gameId, 'leaderboard', 'periods'] as const,
}

export function useGames() {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: gamesKeys.all,
    queryFn: gamesService.getAll,
    refetchInterval,
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
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: gamesKeys.all })
      await queryClient.cancelQueries({ queryKey: gamesKeys.detail(id) })

      // Snapshot the previous value
      const previousGames = queryClient.getQueryData(gamesKeys.all)
      const previousGame = queryClient.getQueryData(gamesKeys.detail(id))

      // Optimistically update the cache
      queryClient.setQueryData(gamesKeys.all, (old: Game[] | undefined) =>
        old?.map((g) => (g.gameId === id ? { ...g, ...data } : g))
      )
      queryClient.setQueryData(gamesKeys.detail(id), (old: Game | undefined) =>
        old ? { ...old, ...data } : old
      )

      return { previousGames, previousGame, id }
    },
    onError: (_, { id }, context) => {
      // Rollback on error
      if (context?.previousGames) {
        queryClient.setQueryData(gamesKeys.all, context.previousGames)
      }
      if (context?.previousGame) {
        queryClient.setQueryData(gamesKeys.detail(id), context.previousGame)
      }
    },
    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
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

export function useCloneGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloneGameInput }) =>
      gamesService.clone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.all })
    },
  })
}

// Leaderboard hooks
export function useLeaderboard(gameId: string, period?: string) {
  return useQuery({
    queryKey: gamesKeys.leaderboard(gameId, period),
    queryFn: () => gamesService.getLeaderboard(gameId, period),
    enabled: !!gameId,
  })
}

export function useLeaderboardPeriods(gameId: string) {
  return useQuery({
    queryKey: gamesKeys.leaderboardPeriods(gameId),
    queryFn: () => gamesService.getLeaderboardPeriods(gameId),
    enabled: !!gameId,
  })
}
