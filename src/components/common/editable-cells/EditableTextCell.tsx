import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

interface EditableTextCellProps {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
  className?: string
  inputClassName?: string
  disabled?: boolean
}

export function EditableTextCell({
  value,
  onSave,
  placeholder = 'Enter value...',
  className,
  inputClassName,
  disabled,
}: EditableTextCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch {
      setEditValue(value)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
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
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving}
          className={cn('h-7 text-sm', inputClassName)}
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
        'cursor-pointer hover:bg-muted/50 px-1 -mx-1 rounded transition-colors',
        disabled && 'cursor-default hover:bg-transparent',
        className
      )}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </span>
  )
}
