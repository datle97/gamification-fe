import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface EditableSelectCellProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onSave: (value: T) => Promise<void>
  renderValue?: (value: T) => React.ReactNode
  className?: string
  disabled?: boolean
}

export function EditableSelectCell<T extends string>({
  value,
  options,
  onSave,
  renderValue,
  className,
  disabled,
}: EditableSelectCellProps<T>) {
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = async (newValue: T) => {
    if (newValue === value) return
    setIsSaving(true)
    try {
      await onSave(newValue)
    } finally {
      setIsSaving(false)
    }
  }

  const displayValue = renderValue
    ? renderValue(value)
    : options.find((o) => o.value === value)?.label || value

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Select
        value={value}
        onValueChange={(v) => handleChange(v as T)}
        disabled={disabled || isSaving}
      >
        <SelectTrigger className="h-auto! w-auto! gap-1! border-0! bg-transparent! p-0! shadow-none! hover:bg-transparent! focus:ring-0! focus-visible:ring-0! dark:bg-transparent! dark:hover:bg-transparent! [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-50">
          <SelectValue>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  )
}
