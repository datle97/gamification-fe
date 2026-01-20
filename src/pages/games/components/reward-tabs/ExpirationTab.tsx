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

interface ExpirationTabProps {
  expirationConfig: string
  onChange: (expirationConfig: string) => void
}

export function ExpirationTab({ expirationConfig, onChange }: ExpirationTabProps) {
  const getExpirationConfig = (): ExpirationConfig | null => {
    try {
      return expirationConfig ? JSON.parse(expirationConfig) : null
    } catch {
      return null
    }
  }

  const updateExpirationConfig = (updates: Partial<ExpirationConfig> | null) => {
    if (!updates) {
      onChange('')
      return
    }

    const current = getExpirationConfig()
    const updated = { ...current, ...updates }

    onChange(JSON.stringify(updated, null, 2))
  }

  const config = getExpirationConfig()
  const mode = config?.mode || 'permanent'

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Configure when rewards expire after being allocated to users. Leave as permanent for rewards
        that never expire.
      </div>

      {/* Mode Selector */}
      <div className="space-y-2">
        <Label>
          Expiration Mode <span className="text-destructive">*</span>
        </Label>
        <Select
          value={mode}
          onValueChange={(value: 'permanent' | 'ttl' | 'fixed' | 'anchor') => {
            if (value === 'permanent') {
              updateExpirationConfig(null)
            } else {
              updateExpirationConfig({ mode: value })
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
          {mode === 'permanent' && 'Rewards never expire once allocated'}
          {mode === 'ttl' && 'Rewards expire after a specified time period from allocation'}
          {mode === 'fixed' && 'Rewards expire on a specific calendar date'}
          {mode === 'anchor' &&
            'Rewards expire at the end of the current period (e.g., end of month)'}
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
                value={config?.value ?? ''}
                onChange={(e) => {
                  const value = e.target.value
                  updateExpirationConfig({
                    mode: 'ttl',
                    value: value ? parseInt(value) : undefined,
                    unit: config?.unit || 'day',
                  })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ttlUnit">
                Unit <span className="text-destructive">*</span>
              </Label>
              <Select
                value={config?.unit || 'day'}
                onValueChange={(value: ExpirationUnit) => {
                  updateExpirationConfig({
                    mode: 'ttl',
                    value: config?.value,
                    unit: value,
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
            Time period from allocation until the reward expires. Example: 30 days means reward
            expires 30 days after user receives it.
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
              value={config?.date ? dayjs(config.date).toDate() : undefined}
              onChange={(date) => {
                updateExpirationConfig({
                  mode: 'fixed',
                  date: date ? dayjs(date).toISOString() : undefined,
                })
              }}
              placeholder="Select date and time"
              showTime
            />
          </div>
          <p className="text-xs text-muted-foreground">
            All rewards will expire on this specific date and time, regardless of when they were
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
                value={config?.unit || 'month'}
                onValueChange={(value: ExpirationUnit) => {
                  updateExpirationConfig({
                    mode: 'anchor',
                    unit: value,
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
                Rewards expire at the end of the current period from allocation time.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Example:</strong> If period is "month" and reward is allocated on Jan 15, it
                will expire on Jan 31 (end of current month).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Note */}
      {mode === 'permanent' && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-950/20 p-4">
          <p className="text-sm text-gray-900 dark:text-gray-200">
            <strong>Note:</strong> Permanent rewards never expire and will remain in the user's
            inventory indefinitely until manually removed or used.
          </p>
        </div>
      )}
    </div>
  )
}
