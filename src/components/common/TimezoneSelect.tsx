import { Combobox } from '@/components/ui/combobox'

// Canonical names that some browsers list as legacy aliases (e.g. Asia/Saigon instead of Asia/Ho_Chi_Minh)
const CANONICAL_TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Seoul',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Pacific/Auckland',
  'Australia/Sydney',
  'UTC',
]

function getUtcOffset(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date())
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
    // "GMT+07:00" -> "UTC+07:00", "GMT" -> "UTC"
    return offset.replace('GMT', 'UTC')
  } catch {
    return ''
  }
}

function getTimezones() {
  const intlTimezones = (Intl as { supportedValuesOf?: (key: string) => string[] })
    .supportedValuesOf?.('timeZone') ?? []

  const set = new Set(intlTimezones)
  for (const tz of CANONICAL_TIMEZONES) {
    set.add(tz)
  }

  return Array.from(set)
    .sort()
    .map((tz) => {
      const offset = getUtcOffset(tz)
      return {
        value: tz,
        label: offset ? `${tz} (${offset})` : tz,
      }
    })
}

const TIMEZONES = getTimezones()

interface TimezoneSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimezoneSelect({ value, onChange, className }: TimezoneSelectProps) {
  return (
    <Combobox
      options={TIMEZONES}
      value={value}
      onChange={onChange}
      placeholder="Select timezone..."
      searchPlaceholder="Search timezones..."
      emptyMessage="No timezone found"
      className={className}
    />
  )
}
