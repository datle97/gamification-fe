import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExpirationConfig, ExpirationUnit } from '@/schemas/reward.schema'
import dayjs from 'dayjs'

interface ExpirationEditorProps {
  value: ExpirationConfig | null
  onChange: (value: ExpirationConfig | null) => void
  description?: string
  /** Label for what expires (e.g., "rewards", "turns", "items") */
  itemLabel?: string
}

export function ExpirationEditor({
  value,
  onChange,
  description,
  itemLabel = 'items',
}: ExpirationEditorProps) {
  const mode = value?.mode || 'permanent'

  const updateConfig = (updates: Partial<ExpirationConfig> | null) => {
    if (!updates) {
      onChange(null)
      return
    }
    onChange({ ...value, ...updates } as ExpirationConfig)
  }

  return (
    <div className="space-y-6">
      {description && <div className="text-sm text-muted-foreground">{description}</div>}

      {/* Mode Selector */}
      <div className="space-y-2">
        <Label>
          Expiration Mode <span className="text-destructive">*</span>
        </Label>
        <Select
          value={mode}
          onValueChange={(val: 'permanent' | 'ttl' | 'fixed' | 'anchor') => {
            if (val === 'permanent') {
              updateConfig(null)
            } else {
              updateConfig({ mode: val })
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="permanent">Permanent - Never expires</SelectItem>
            <SelectItem value="ttl">TTL - Expires after time period</SelectItem>
            <SelectItem value="fixed">Fixed Date - Expires on specific date</SelectItem>
            <SelectItem value="anchor">Anchor - Expires relative to a period</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {mode === 'permanent' && `${capitalize(itemLabel)} never expire once allocated`}
          {mode === 'ttl' && `${capitalize(itemLabel)} expire after a specified time period`}
          {mode === 'fixed' && `${capitalize(itemLabel)} expire on a specific calendar date`}
          {mode === 'anchor' &&
            `${capitalize(itemLabel)} expire at the end of the current period (e.g., end of month)`}
        </p>
      </div>

      {/* Divider */}
      {mode !== 'permanent' && <div className="border-t" />}

      {/* TTL Mode */}
      {mode === 'ttl' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Time to Live</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ttlValue">
                Value <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ttlValue"
                type="number"
                min={1}
                placeholder="30"
                value={value?.value ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  updateConfig({
                    mode: 'ttl',
                    value: val ? parseInt(val) : undefined,
                    unit: value?.unit || 'day',
                  })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ttlUnit">
                Unit <span className="text-destructive">*</span>
              </Label>
              <Select
                value={value?.unit || 'day'}
                onValueChange={(val: ExpirationUnit) => {
                  updateConfig({
                    mode: 'ttl',
                    value: value?.value,
                    unit: val,
                  })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="second">Seconds</SelectItem>
                  <SelectItem value="minute">Minutes</SelectItem>
                  <SelectItem value="hour">Hours</SelectItem>
                  <SelectItem value="day">Days</SelectItem>
                  <SelectItem value="week">Weeks</SelectItem>
                  <SelectItem value="month">Months</SelectItem>
                  <SelectItem value="year">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Time period from allocation until expiration. Example: 30 days means expiration 30 days
            after allocation.
          </p>
        </div>
      )}

      {/* Fixed Date Mode */}
      {mode === 'fixed' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Fixed Expiration Date</h4>
          <div className="space-y-2">
            <Label>
              Date & Time <span className="text-destructive">*</span>
            </Label>
            <DatePicker
              value={value?.date ? dayjs(value.date).toDate() : undefined}
              onChange={(date) => {
                updateConfig({
                  mode: 'fixed',
                  date: date ? dayjs(date).toISOString() : undefined,
                })
              }}
              placeholder="Select date and time"
              showTime
            />
          </div>
          <p className="text-xs text-muted-foreground">
            All {itemLabel} will expire on this specific date and time, regardless of when they were
            allocated.
          </p>
        </div>
      )}

      {/* Anchor Mode */}
      {mode === 'anchor' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Anchor-Based Expiration</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="anchorUnit">
                Period <span className="text-destructive">*</span>
              </Label>
              <Select
                value={value?.unit || 'month'}
                onValueChange={(val: ExpirationUnit) => {
                  updateConfig({
                    mode: 'anchor',
                    unit: val,
                  })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {capitalize(itemLabel)} expire at the end of the current period from allocation
                time.
              </p>
            </div>

            <div className="rounded-lg border border-muted-foreground/20 bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Example:</strong> If period is "month" and
                allocated on Jan 15, expiration will be Jan 31 (end of current month).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Note */}
      {mode === 'permanent' && (
        <div className="rounded-lg border border-muted-foreground/20 bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Note:</strong> Permanent {itemLabel} never expire
            and will remain in the user's inventory indefinitely until manually removed or used.
          </p>
        </div>
      )}
    </div>
  )
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
