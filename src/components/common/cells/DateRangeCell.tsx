import { useDateFormat } from '@/stores/settingsStore'
import dayjs from 'dayjs'

interface DateRangeCellProps {
  startAt: string | Date | null | undefined
  endAt: string | Date | null | undefined
  showTime?: boolean
}

export function DateRangeCell({ startAt, endAt, showTime }: DateRangeCellProps) {
  const dateFormat = useDateFormat()
  const format = showTime ? `${dateFormat} HH:mm` : dateFormat

  if (!startAt && !endAt) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <div className="text-sm text-muted-foreground">
      {startAt ? dayjs(startAt).format(format) : '∞'}
      {' → '}
      {endAt ? dayjs(endAt).format(format) : '∞'}
    </div>
  )
}
