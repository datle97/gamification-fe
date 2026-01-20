import { cn } from '@/lib/utils'
import { useDateFormat } from '@/stores/settingsStore'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

interface DateCellProps {
  value: string | Date | null | undefined
  showTime?: boolean
  relative?: boolean
  className?: string
}

export function DateCell({ value, showTime, relative, className }: DateCellProps) {
  const dateFormat = useDateFormat()
  const format = showTime ? `${dateFormat} HH:mm` : dateFormat

  if (!value) {
    return <span className="text-muted-foreground">-</span>
  }

  if (relative) {
    return (
      <div className={cn('flex flex-col', className)}>
        <span className="text-sm">{dayjs(value).format(format)}</span>
        <span className="text-xs text-muted-foreground">{dayjs(value).fromNow()}</span>
      </div>
    )
  }

  return (
    <span className={cn('text-muted-foreground', className)}>{dayjs(value).format(format)}</span>
  )
}
