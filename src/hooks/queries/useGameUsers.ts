import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  gameUsersService,
  type CheckEligibilityInput,
  type GrantTurnsInput,
  type ListGameUsersParams,
  type TestPlayInput,
} from '@/services/game-users.service'
import { useRefetchInterval } from '@/hooks/useAutoRefresh'

export const gameUsersKeys = {
  all: ['game-users'] as const,
  byGame: (gameId: string) => ['game-users', 'game', gameId] as const,
  list: (params: ListGameUsersParams) => ['game-users', 'list', params] as const,
  stats: (gameId: string) => ['game-users', 'stats', gameId] as const,
  detail: (gameId: string, userId: string) => ['game-users', gameId, userId] as const,
}

export function useGameUsers(params: ListGameUsersParams) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: gameUsersKeys.list(params),
    queryFn: () => gameUsersService.listByGame(params),
    enabled: !!params.gameId,
    refetchInterval,
  })
}

export function useGameStats(gameId: string) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: gameUsersKeys.stats(gameId),
    queryFn: () => gameUsersService.getStats(gameId),
    enabled: !!gameId,
    refetchInterval,
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

export function useResetMissionProgress(gameId: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (missionId: string) =>
      gameUsersService.resetMissionProgress(gameId, userId, missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'missions'],
      })
    },
  })
}

export function useResetAllMissionsProgress(gameId: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => gameUsersService.resetAllMissionsProgress(gameId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'missions'],
      })
    },
  })
}

export function useRevokeUserReward(gameId: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userRewardId: string) =>
      gameUsersService.revokeUserReward(gameId, userId, userRewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'rewards'],
      })
    },
  })
}

export function useUserActivities(gameId: string, userId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: [...gameUsersKeys.detail(gameId, userId), 'activities', page, limit] as const,
    queryFn: () => gameUsersService.getActivities(gameId, userId, page, limit),
    enabled: !!gameId && !!userId,
  })
}

export function useUpdateUserAttributes(gameId: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attributes: Record<string, unknown>) =>
      gameUsersService.updateAttributes(gameId, userId, attributes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gameUsersKeys.detail(gameId, userId),
      })
    },
  })
}

export function useResetUserState(gameId: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => gameUsersService.resetState(gameId, userId),
    onSuccess: () => {
      // Invalidate sandbox user query to refresh remaining turns
      queryClient.invalidateQueries({
        queryKey: ['sandbox-user', gameId],
      })
      // Invalidate all user-related queries
      queryClient.invalidateQueries({
        queryKey: gameUsersKeys.detail(gameId, userId),
      })
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'turns'],
      })
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'rewards'],
      })
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'missions'],
      })
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'activities'],
      })
    },
  })
}

// Test Sandbox hooks
export function useSandboxUser(gameId: string) {
  return useQuery({
    queryKey: ['sandbox-user', gameId] as const,
    queryFn: () => gameUsersService.getSandboxUser(gameId),
    enabled: !!gameId,
  })
}

export function useTestPlay(gameId: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input?: TestPlayInput) => gameUsersService.testPlay(gameId, userId, input),
    onSuccess: () => {
      // Invalidate sandbox user query to refresh remaining turns
      queryClient.invalidateQueries({
        queryKey: ['sandbox-user', gameId],
      })
      // Invalidate user-related queries after test play
      queryClient.invalidateQueries({
        queryKey: gameUsersKeys.detail(gameId, userId),
      })
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'turns'],
      })
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'rewards'],
      })
      queryClient.invalidateQueries({
        queryKey: [...gameUsersKeys.detail(gameId, userId), 'activities'],
      })
    },
  })
}
