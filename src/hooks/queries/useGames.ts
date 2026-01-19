import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gamesService } from '@/services/games.service'
import type { CreateGameInput, UpdateGameInput, CloneGameInput } from '@/schemas/game.schema'
import { useRefetchInterval } from '@/hooks/useAutoRefresh'

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
