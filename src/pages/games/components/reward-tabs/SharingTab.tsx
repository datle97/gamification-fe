import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SharingTabProps {
  shareConfig: string
  onChange: (shareConfig: string) => void
}

export function SharingTab({ shareConfig, onChange }: SharingTabProps) {
  const getShareConfig = () => {
    try {
      return shareConfig ? JSON.parse(shareConfig) : {}
    } catch {
      return {}
    }
  }

  const updateShareConfig = (updates: Record<string, unknown>) => {
    const current = getShareConfig()
    const updated = { ...current, ...updates }

    // If disabled, clear the config
    if (updated.enabled === false) {
      onChange('')
      return
    }

    // Clean up empty objects
    Object.keys(updated).forEach((key) => {
      if (
        updated[key] &&
        typeof updated[key] === 'object' &&
        !Array.isArray(updated[key]) &&
        Object.keys(updated[key] as Record<string, unknown>).length === 0
      ) {
        delete updated[key]
      }
    })

    onChange(Object.keys(updated).length > 0 ? JSON.stringify(updated, null, 2) : '')
  }

  const config = getShareConfig()
  const isEnabled = config.enabled === true

  return (
    <div className="space-y-6">
      {/* Enable/Disable Sharing */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="enabled"
            checked={isEnabled}
            onCheckedChange={(checked) =>
              updateShareConfig({
                enabled: !!checked,
                // Keep existing config if enabling
                ...(checked ? config : {}),
              })
            }
          />
          <Label htmlFor="enabled" className="cursor-pointer font-medium">
            Enable reward sharing
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Allow users to share this reward with others via phone number or public link
        </p>
      </div>

      {/* Sharing Configuration (only show when enabled) */}
      {isEnabled && (
        <>
          <div className="border-t pt-6 space-y-4">
            <h4 className="text-sm font-semibold">Share Types</h4>
            <p className="text-sm text-muted-foreground">
              Select which sharing methods are allowed (default: both if enabled)
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="phone"
                  checked={
                    !config.allowedTypes ||
                    (config.allowedTypes as string[])?.includes('phone') ||
                    false
                  }
                  onCheckedChange={(checked) => {
                    const current = (config.allowedTypes as string[]) || ['phone', 'public']
                    const updated = checked
                      ? [...new Set([...current, 'phone'])]
                      : current.filter((t: string) => t !== 'phone')
                    updateShareConfig({
                      ...config,
                      allowedTypes: updated.length > 0 ? updated : undefined,
                    })
                  }}
                />
                <Label htmlFor="phone" className="cursor-pointer">
                  Phone Number Sharing
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                User can share reward directly to specific phone numbers
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public"
                  checked={
                    !config.allowedTypes ||
                    (config.allowedTypes as string[])?.includes('public') ||
                    false
                  }
                  onCheckedChange={(checked) => {
                    const current = (config.allowedTypes as string[]) || ['phone', 'public']
                    const updated = checked
                      ? [...new Set([...current, 'public'])]
                      : current.filter((t: string) => t !== 'public')
                    updateShareConfig({
                      ...config,
                      allowedTypes: updated.length > 0 ? updated : undefined,
                    })
                  }}
                />
                <Label htmlFor="public" className="cursor-pointer">
                  Public Link Sharing
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                User can generate a public link that anyone can claim
              </p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h4 className="text-sm font-semibold">Share Limits</h4>
            <div className="space-y-2">
              <Label htmlFor="maxPerUser">Max Shares Per User</Label>
              <Input
                id="maxPerUser"
                type="number"
                min={1}
                placeholder="Unlimited"
                value={(() => {
                  const conditions = config.conditions as Record<string, unknown> | undefined
                  const uniqueness = conditions?.uniqueness as Record<string, unknown> | undefined
                  const maxPerUser = uniqueness?.maxPerUser
                  return typeof maxPerUser === 'number' ? maxPerUser : ''
                })()}
                onChange={(e) => {
                  const value = e.target.value
                  const conditions = config.conditions as Record<string, unknown> | undefined
                  updateShareConfig({
                    ...config,
                    conditions: value
                      ? {
                          ...conditions,
                          uniqueness: { maxPerUser: parseInt(value) },
                        }
                      : {
                          ...conditions,
                          uniqueness: undefined,
                        },
                  })
                }}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of times each user can share this specific reward. Leave empty for
                unlimited.
              </p>
            </div>
          </div>

          {/* Advanced Note */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Advanced sharing conditions:</strong> For complex share prevention rules
              (e.g., block sharing if user owns certain rewards), use the Advanced tab to edit the
              shareConfig JSON directly.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
