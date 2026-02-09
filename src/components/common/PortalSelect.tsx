import { Combobox } from '@/components/ui/combobox'
import { usePortals } from '@/hooks/queries'
import { useMemo } from 'react'

interface PortalSelectProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function PortalSelect({ value, onChange, className }: PortalSelectProps) {
  const { data: portals = [] } = usePortals()

  const options = useMemo(
    () => portals.map((p) => ({ value: String(p.portalId), label: `${p.name} (${p.portalId})` })),
    [portals]
  )

  return (
    <Combobox
      options={options}
      value={String(value || '')}
      onChange={(v) => onChange(parseInt(v) || 0)}
      placeholder="Select portal..."
      searchPlaceholder="Search portals..."
      emptyMessage="No portals found"
      className={className}
      allowCustom
    />
  )
}
