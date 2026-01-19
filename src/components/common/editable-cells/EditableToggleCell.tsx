import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface EditableToggleCellProps {
  value: boolean
  onSave: (value: boolean) => Promise<void>
  disabled?: boolean
}

export function EditableToggleCell({
  value,
  onSave,
  disabled,
}: EditableToggleCellProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = async (newValue: boolean) => {
    setIsSaving(true)
    try {
      await onSave(newValue)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Switch
        checked={value}
        onCheckedChange={handleChange}
        disabled={disabled || isSaving}
        className="data-[state=checked]:bg-primary"
      />
      {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  )
}
