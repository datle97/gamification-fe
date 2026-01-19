import { useRefetchInterval } from '@/hooks/useAutoRefresh'
import { gamesService } from '@/services/games.service'
import { useQuery } from '@tanstack/react-query'

export function useDashboardStats() {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: gamesService.getDashboardStats,
    staleTime: 5 * 60 * 1000,
    refetchInterval,
  })
}
