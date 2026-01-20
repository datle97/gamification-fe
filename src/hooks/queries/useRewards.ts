import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rewardsService } from '@/services/rewards.service'
import { useAnalytics } from '@/stores/settingsStore'
import type { CreateRewardInput, UpdateRewardInput, Reward } from '@/schemas/reward.schema'

export const rewardsKeys = {
  all: ['rewards'] as const,
  byGame: (gameId: string) => ['rewards', 'game', gameId] as const,
  detail: (id: string) => ['rewards', id] as const,
  distribution: (gameId: string) => ['rewards', 'distribution', gameId] as const,
}

export function useRewards() {
  return useQuery({
    queryKey: rewardsKeys.all,
    queryFn: rewardsService.getAll,
  })
}

export function useRewardsByGame(gameId: string) {
  return useQuery({
    queryKey: rewardsKeys.byGame(gameId),
    queryFn: () => rewardsService.getByGameId(gameId),
    enabled: !!gameId,
  })
}

export function useReward(id: string) {
  return useQuery({
    queryKey: rewardsKeys.detail(id),
    queryFn: () => rewardsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateReward() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRewardInput) => rewardsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
    },
  })
}

export function useUpdateReward() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRewardInput }) =>
      rewardsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      queryClient.invalidateQueries({ queryKey: rewardsKeys.detail(id) })
    },
  })
}

export function useBatchUpdateRewards() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ rewardId: string; data: Partial<Reward> }>) =>
      rewardsService.batchUpdate(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
    },
  })
}

export function useDeleteReward() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rewardsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
    },
  })
}

export function useRewardDistribution(gameId: string) {
  const showAnalytics = useAnalytics()
  return useQuery({
    queryKey: rewardsKeys.distribution(gameId),
    queryFn: () => rewardsService.getDistribution(gameId),
    enabled: !!gameId && showAnalytics,
  })
}
