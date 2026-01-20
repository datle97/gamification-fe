import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EditableNumberCellProps {
  value: number | null | undefined
  onSave: (value: number | null) => Promise<void>
  min?: number
  max?: number
  placeholder?: string
  emptyDisplay?: string
  className?: string
  disabled?: boolean
}

const toEditString = (v: number | null | undefined) => v?.toString() ?? ''

export function EditableNumberCell({
  value,
  onSave,
  min,
  max,
  placeholder = '0',
  emptyDisplay = '-',
  className,
  disabled,
}: EditableNumberCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(() => toEditString(value))
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(toEditString(value))
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmed = editValue.trim()
    const newValue = trimmed === '' ? null : parseFloat(trimmed)

    // Invalid number or no change
    if ((newValue !== null && isNaN(newValue)) || newValue === (value ?? null)) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(newValue)
      setIsEditing(false)
    } catch {
      setEditValue(toEditString(value))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(toEditString(value))
    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          placeholder={placeholder}
          disabled={isSaving}
          className="h-7 text-sm w-20"
        />
        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
    )
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) setIsEditing(true)
      }}
      className={cn(
        'cursor-pointer hover:bg-muted/50 px-1 -mx-1 rounded transition-colors tabular-nums',
        disabled && 'cursor-default hover:bg-transparent',
        value == null && 'text-muted-foreground',
        className
      )}
    >
      {value ?? emptyDisplay}
    </span>
  )
}
