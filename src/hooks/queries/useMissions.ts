import type { CreateMissionInput, UpdateMissionInput } from '@/schemas/mission.schema'
import { missionsService } from '@/services/missions.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const missionsKeys = {
  all: ['missions'] as const,
  byGame: (gameId: string) => ['missions', 'game', gameId] as const,
  detail: (id: string) => ['missions', id] as const,
}

export function useMissions() {
  return useQuery({
    queryKey: missionsKeys.all,
    queryFn: missionsService.getAll,
  })
}

export function useMissionsByGame(gameId: string) {
  return useQuery({
    queryKey: missionsKeys.byGame(gameId),
    queryFn: () => missionsService.getByGameId(gameId),
    enabled: !!gameId,
  })
}

export function useMission(id: string) {
  return useQuery({
    queryKey: missionsKeys.detail(id),
    queryFn: () => missionsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateMission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMissionInput) => missionsService.create(data),
    onSuccess: () => {
      // Invalidate all mission queries (all, byGame, etc.)
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export function useUpdateMission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ gameId, id, data }: { gameId: string; id: string; data: UpdateMissionInput }) =>
      missionsService.update(gameId, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      queryClient.invalidateQueries({ queryKey: missionsKeys.detail(id) })
    },
  })
}

export function useDeleteMission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ gameId, id }: { gameId: string; id: string }) =>
      missionsService.delete(gameId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}
