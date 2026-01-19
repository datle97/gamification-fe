import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EditableStackedCellProps {
  primary: string
  secondary?: string | null
  onSave: (value: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
}

export function EditableStackedCell({
  primary,
  secondary,
  onSave,
  placeholder = 'Enter value...',
  disabled,
}: EditableStackedCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(primary)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(primary)
  }, [primary])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editValue === primary) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch {
      setEditValue(primary)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(primary)
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
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving}
          className="h-7 text-sm font-medium"
        />
        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
    )
  }

  return (
    <div onClick={() => !disabled && setIsEditing(true)} className="cursor-pointer">
      <span
        className={cn(
          'font-medium hover:bg-muted/50 px-1 -mx-1 rounded transition-colors',
          disabled && 'cursor-default hover:bg-transparent'
        )}
      >
        {primary || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
      {secondary && <div className="text-xs text-muted-foreground">{secondary}</div>}
    </div>
  )
}
