import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import { CalendarIcon, Clock2Icon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  numberOfMonths?: number
  showTime?: boolean
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  className,
  numberOfMonths = 2,
  showTime = false,
}: DateRangePickerProps) {
  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange?.(undefined)
      return
    }

    if (showTime && value) {
      // Preserve existing times when selecting new dates
      const from = range.from
        ? dayjs(range.from)
            .hour(value.from ? dayjs(value.from).hour() : 0)
            .minute(value.from ? dayjs(value.from).minute() : 0)
            .second(0)
            .toDate()
        : undefined
      const to = range.to
        ? dayjs(range.to)
            .hour(value.to ? dayjs(value.to).hour() : 23)
            .minute(value.to ? dayjs(value.to).minute() : 59)
            .endOf('minute')
            .toDate()
        : undefined
      onChange?.({ from, to })
    } else if (showTime) {
      // Default times for new datetime selection
      const from = range.from ? dayjs(range.from).hour(0).minute(0).second(0).toDate() : undefined
      const to = range.to ? dayjs(range.to).hour(23).minute(59).endOf('minute').toDate() : undefined
      onChange?.({ from, to })
    } else {
      onChange?.(range)
    }
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    if (!timeValue || !value?.from) return

    const [hours, minutes] = timeValue.split(':').map(Number)
    const updatedFrom = dayjs(value.from).hour(hours).minute(minutes).second(0).toDate()
    onChange?.({ ...value, from: updatedFrom })
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    if (!timeValue || !value?.to) return

    const [hours, minutes] = timeValue.split(':').map(Number)
    const updatedTo = dayjs(value.to).hour(hours).minute(minutes).endOf('minute').toDate()
    onChange?.({ ...value, to: updatedTo })
  }

  const formatDisplay = () => {
    if (!value?.from) return null

    if (showTime) {
      if (value.to) {
        return `${dayjs(value.from).format('MMM D, YYYY HH:mm')} - ${dayjs(value.to).format('MMM D, YYYY HH:mm')}`
      }
      return dayjs(value.from).format('MMM D, YYYY HH:mm')
    }

    if (value.to) {
      return `${dayjs(value.from).format('MMM D, YYYY')} - ${dayjs(value.to).format('MMM D, YYYY')}`
    }

    return dayjs(value.from).format('MMM D, YYYY')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value?.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplay() || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={handleRangeSelect}
          numberOfMonths={numberOfMonths}
          className="rounded-lg"
        />
        {showTime && (
          <div className="border-t p-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Start Time</Label>
                <div className="relative">
                  <Clock2Icon className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4" />
                  <Input
                    type="time"
                    value={value?.from ? dayjs(value.from).format('HH:mm') : '00:00'}
                    onChange={handleStartTimeChange}
                    disabled={!value?.from}
                    className="pl-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">End Time</Label>
                <div className="relative">
                  <Clock2Icon className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4" />
                  <Input
                    type="time"
                    value={value?.to ? dayjs(value.to).format('HH:mm') : '23:59'}
                    onChange={handleEndTimeChange}
                    disabled={!value?.to}
                    className="pl-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
