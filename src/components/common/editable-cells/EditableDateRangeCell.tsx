import { useState } from 'react'
import dayjs from 'dayjs'
import { type DateRange } from 'react-day-picker'
import { Loader2, Clock2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDateFormat } from '@/stores/settingsStore'

interface EditableDateRangeCellProps {
  startAt: string | Date | null | undefined
  endAt: string | Date | null | undefined
  onSave: (startAt: string | null, endAt: string | null) => Promise<void>
  showTime?: boolean
  disabled?: boolean
}

export function EditableDateRangeCell({
  startAt,
  endAt,
  onSave,
  showTime = false,
  disabled,
}: EditableDateRangeCellProps) {
  const dateFormat = useDateFormat()
  const format = showTime ? `${dateFormat} HH:mm` : dateFormat

  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editRange, setEditRange] = useState<DateRange | undefined>(() => {
    const from = startAt ? dayjs(startAt).toDate() : undefined
    const to = endAt ? dayjs(endAt).toDate() : undefined
    return from || to ? { from, to } : undefined
  })

  const handleOpen = (open: boolean) => {
    if (open) {
      const from = startAt ? dayjs(startAt).toDate() : undefined
      const to = endAt ? dayjs(endAt).toDate() : undefined
      setEditRange(from || to ? { from, to } : undefined)
    }
    setIsOpen(open)
  }

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) {
      setEditRange(undefined)
      return
    }

    // Always preserve existing times when selecting new dates
    if (editRange) {
      const from = range.from
        ? dayjs(range.from)
            .hour(editRange.from ? dayjs(editRange.from).hour() : 0)
            .minute(editRange.from ? dayjs(editRange.from).minute() : 0)
            .second(0)
            .toDate()
        : undefined
      const to = range.to
        ? dayjs(range.to)
            .hour(editRange.to ? dayjs(editRange.to).hour() : 23)
            .minute(editRange.to ? dayjs(editRange.to).minute() : 59)
            .endOf('minute')
            .toDate()
        : undefined
      setEditRange({ from, to })
    } else {
      // Default times for new selection
      const from = range.from ? dayjs(range.from).hour(0).minute(0).second(0).toDate() : undefined
      const to = range.to ? dayjs(range.to).hour(23).minute(59).endOf('minute').toDate() : undefined
      setEditRange({ from, to })
    }
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    if (!timeValue || !editRange?.from) return

    const [hours, minutes] = timeValue.split(':').map(Number)
    const updatedFrom = dayjs(editRange.from).hour(hours).minute(minutes).second(0).toDate()
    setEditRange({ ...editRange, from: updatedFrom })
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    if (!timeValue || !editRange?.to) return

    const [hours, minutes] = timeValue.split(':').map(Number)
    const updatedTo = dayjs(editRange.to).hour(hours).minute(minutes).endOf('minute').toDate()
    setEditRange({ ...editRange, to: updatedTo })
  }

  const handleSave = async () => {
    const newStartAt = editRange?.from ? dayjs(editRange.from).toISOString() : null
    const newEndAt = editRange?.to ? dayjs(editRange.to).toISOString() : null

    const oldStartAt = startAt ? dayjs(startAt).toISOString() : null
    const oldEndAt = endAt ? dayjs(endAt).toISOString() : null

    if (newStartAt === oldStartAt && newEndAt === oldEndAt) {
      setIsOpen(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(newStartAt, newEndAt)
      setIsOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const displayValue = () => {
    if (!startAt && !endAt) {
      return <span className="text-muted-foreground">-</span>
    }
    return (
      <>
        {startAt ? dayjs(startAt).format(format) : '∞'}
        {' → '}
        {endAt ? dayjs(endAt).format(format) : '∞'}
      </>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={isOpen} onOpenChange={handleOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:bg-muted/50 px-1 -mx-1 rounded transition-colors cursor-pointer text-left"
          >
            {displayValue()}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={editRange?.from}
            selected={editRange}
            onSelect={handleRangeSelect}
            numberOfMonths={2}
          />
          <div className="border-t p-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Start Time</Label>
                <div className="relative">
                  <Clock2Icon className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4" />
                  <Input
                    type="time"
                    value={editRange?.from ? dayjs(editRange.from).format('HH:mm') : '00:00'}
                    onChange={handleStartTimeChange}
                    disabled={!editRange?.from}
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
                    value={editRange?.to ? dayjs(editRange.to).format('HH:mm') : '23:59'}
                    onChange={handleEndTimeChange}
                    disabled={!editRange?.to}
                    className="pl-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t p-3">
            <Button className="w-full" size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  )
}
