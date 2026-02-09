import { Combobox } from '@/components/ui/combobox'
import { useApps } from '@/hooks/queries'
import { useMemo } from 'react'

interface AppSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function AppSelect({ value, onChange, className }: AppSelectProps) {
  const { data: apps = [] } = useApps()

  const options = useMemo(
    () => apps.map((a) => ({ value: a.appId, label: `${a.name} (${a.appId})` })),
    [apps]
  )

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select app..."
      searchPlaceholder="Search apps..."
      emptyMessage="No apps found"
      className={className}
    />
  )
}
