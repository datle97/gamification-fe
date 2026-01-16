import { useAutoRefreshInterval } from '@/stores/settingsStore'

/**
 * Hook that returns refetchInterval value for TanStack Query
 * Returns false if auto-refresh is disabled, otherwise returns milliseconds
 */
export function useRefetchInterval(): number | false {
  const interval = useAutoRefreshInterval()
  // 0 means disabled, otherwise convert seconds to milliseconds
  return interval === 0 ? false : interval * 1000
}

/**
 * Hook that returns query options with auto-refresh configured
 * Can be spread into useQuery options
 */
export function useAutoRefreshOptions() {
  const refetchInterval = useRefetchInterval()
  return {
    refetchInterval,
    refetchIntervalInBackground: false, // Don't refetch when tab is not focused
  }
}
