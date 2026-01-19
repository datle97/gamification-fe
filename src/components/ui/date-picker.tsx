import dayjs from 'dayjs'
import { CalendarIcon, Clock2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  showTime?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  showTime = false,
}: DatePickerProps) {
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.(undefined)
      return
    }

    if (showTime && value) {
      // Preserve existing time when selecting a new date
      const updatedDate = dayjs(date)
        .hour(dayjs(value).hour())
        .minute(dayjs(value).minute())
        .second(0)
        .toDate()
      onChange?.(updatedDate)
    } else if (showTime) {
      // Default to 00:00 for new datetime selection
      const updatedDate = dayjs(date).hour(0).minute(0).second(0).toDate()
      onChange?.(updatedDate)
    } else {
      onChange?.(date)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    if (!timeValue) return

    const [hours, minutes] = timeValue.split(':').map(Number)
    const date = value ? dayjs(value) : dayjs()
    const updatedDate = date.hour(hours).minute(minutes).second(0).toDate()
    onChange?.(updatedDate)
  }

  const formatDisplay = () => {
    if (!value) return null
    if (showTime) {
      return dayjs(value).format('MMM D, YYYY HH:mm')
    }
    return dayjs(value).format('MMMM D, YYYY')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplay() || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          autoFocus
        />
        {showTime && (
          <div className="border-t p-3">
            <div className="relative">
              <Clock2Icon className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4" />
              <Input
                type="time"
                value={value ? dayjs(value).format('HH:mm') : '00:00'}
                onChange={handleTimeChange}
                className="pl-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
