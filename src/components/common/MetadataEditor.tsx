import { memo } from 'react'
import { JsonEditor } from './JsonEditor'

interface MetadataEditorProps {
  value: string // JSON string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export const MetadataEditor = memo(function MetadataEditor({
  value,
  onChange,
  className,
}: MetadataEditorProps) {
  return <JsonEditor value={value} onChange={onChange} className={className} />
})
