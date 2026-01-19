import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import { useDateFormat } from '@/stores/settingsStore'

interface DateCellProps {
  value: string | Date | null | undefined
  showTime?: boolean
  className?: string
}

export function DateCell({ value, showTime, className }: DateCellProps) {
  const dateFormat = useDateFormat()
  const format = showTime ? `${dateFormat} HH:mm` : dateFormat

  if (!value) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <span className={cn('text-muted-foreground', className)}>
      {dayjs(value).format(format)}
    </span>
  )
}
