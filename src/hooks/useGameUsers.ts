import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  gameUsersService,
  type CheckEligibilityInput,
  type GrantTurnsInput,
  type ListGameUsersParams,
} from '@/services/game-users.service'

export const gameUsersKeys = {
  all: ['game-users'] as const,
  byGame: (gameId: string) => ['game-users', 'game', gameId] as const,
  list: (params: ListGameUsersParams) => ['game-users', 'list', params] as const,
  stats: (gameId: string) => ['game-users', 'stats', gameId] as const,
  detail: (gameId: string, userId: string) => ['game-users', gameId, userId] as const,
}

export function useGameUsers(params: ListGameUsersParams) {
  return useQuery({
    queryKey: gameUsersKeys.list(params),
    queryFn: () => gameUsersService.listByGame(params),
    enabled: !!params.gameId,
  })
}

export function useGameStats(gameId: string) {
  return useQuery({
    queryKey: gameUsersKeys.stats(gameId),
    queryFn: () => gameUsersService.getStats(gameId),
    enabled: !!gameId,
  })
}

export function useGameUserDetail(gameId: string, userId: string) {
  return useQuery({
    queryKey: gameUsersKeys.detail(gameId, userId),
    queryFn: () => gameUsersService.getDetail(gameId, userId),
    enabled: !!gameId && !!userId,
  })
}

export function useUserTurns(gameId: string, userId: string) {
  return useQuery({
    queryKey: [...gameUsersKeys.detail(gameId, userId), 'turns'] as const,
    queryFn: () => gameUsersService.getTurns(gameId, userId),
    enabled: !!gameId && !!userId,
  })
}

export function useUserRewards(gameId: string, userId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: [...gameUsersKeys.detail(gameId, userId), 'rewards', page, limit] as const,
    queryFn: () => gameUsersService.getRewards(gameId, userId, page, limit),
    enabled: !!gameId && !!userId,
  })
}

export function useUserMissions(gameId: string, userId: string) {
  return useQuery({
    queryKey: [...gameUsersKeys.detail(gameId, userId), 'missions'] as const,
    queryFn: () => gameUsersService.getMissions(gameId, userId),
    enabled: !!gameId && !!userId,
  })
}

export function useCheckEligibility(gameId: string, userId: string) {
  return useMutation({
    mutationFn: (input?: CheckEligibilityInput) =>
      gameUsersService.checkEligibility(gameId, userId, input),
  })
}

export function useGrantTurns(gameId: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GrantTurnsInput) =>
      gameUsersService.grantTurns(gameId, userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'turns'],
      })
      queryClient.invalidateQueries({
        queryKey: gameUsersKeys.detail(gameId, userId),
      })
    },
  })
}
