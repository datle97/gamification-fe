import { useDateFormat, type DateFormat } from '@/stores/settingsStore'
import dayjs from 'dayjs'
import { useCallback } from 'react'

/**
 * Hook that returns date formatting functions based on user settings
 */
export function useFormatDate() {
  const dateFormat = useDateFormat()

  // Convert our format to dayjs format
  const getDatePattern = useCallback(
    (includeTime = false) => {
      const timePattern = includeTime ? ' HH:mm' : ''
      switch (dateFormat) {
        case 'MM/DD/YYYY':
          return `MM/DD/YYYY${timePattern}`
        case 'YYYY-MM-DD':
          return `YYYY-MM-DD${timePattern}`
        case 'DD/MM/YYYY':
        default:
          return `DD/MM/YYYY${timePattern}`
      }
    },
    [dateFormat]
  )

  /**
   * Format a date string or Date object
   */
  const formatDate = useCallback(
    (date: string | Date | null | undefined, includeTime = false): string => {
      if (!date) return '-'
      const d = dayjs(date)
      if (!d.isValid()) return '-'
      return d.format(getDatePattern(includeTime))
    },
    [getDatePattern]
  )

  /**
   * Format date with time (shorthand)
   */
  const formatDateTime = useCallback(
    (date: string | Date | null | undefined): string => {
      return formatDate(date, true)
    },
    [formatDate]
  )

  /**
   * Format as relative time (e.g., "2 hours ago")
   */
  const formatRelative = useCallback((date: string | Date | null | undefined): string => {
    if (!date) return '-'
    const d = dayjs(date)
    if (!d.isValid()) return '-'
    return d.fromNow()
  }, [])

  return {
    formatDate,
    formatDateTime,
    formatRelative,
    dateFormat,
  }
}

// Re-export type for convenience
export type { DateFormat }
