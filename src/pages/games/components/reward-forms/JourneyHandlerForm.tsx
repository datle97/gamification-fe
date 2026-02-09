import { PortalSelect } from '@/components/common/PortalSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { JourneyRewardConfig } from '@/schemas/reward.schema'
import { useMemo, useState } from 'react'

interface JourneyHandlerFormProps {
  config: JourneyRewardConfig
  onChange: (config: JourneyRewardConfig) => void
}

export function JourneyHandlerForm({ config, onChange }: JourneyHandlerFormProps) {
  // Local state for extra JSON editing (to handle invalid JSON during typing)
  const [extraText, setExtraText] = useState(() =>
    config.extra ? JSON.stringify(config.extra, null, 2) : ''
  )

  const updateConfig = <K extends keyof JourneyRewardConfig>(
    key: K,
    value: JourneyRewardConfig[K] | undefined
  ) => {
    const newConfig = { ...config }
    if (value === undefined || value === '') {
      delete newConfig[key]
    } else {
      newConfig[key] = value
    }
    onChange(newConfig)
  }

  const handleExtraChange = (value: string) => {
    setExtraText(value)
    try {
      const extraObj = value.trim() ? JSON.parse(value) : undefined
      updateConfig('extra', extraObj)
    } catch {
      // Invalid JSON, keep local state but don't update config
    }
  }

  // Sync extra text when config.extra changes externally
  const extraValue = useMemo(() => {
    const configExtra = config.extra ? JSON.stringify(config.extra, null, 2) : ''
    // Only update if different to avoid cursor jumping
    if (configExtra !== extraText) {
      try {
        const parsed = extraText.trim() ? JSON.parse(extraText) : undefined
        if (JSON.stringify(parsed) !== JSON.stringify(config.extra)) {
          return configExtra
        }
      } catch {
        // If current text is invalid JSON, use config value
        return configExtra
      }
    }
    return extraText
  }, [config.extra, extraText])

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Journey API Configuration</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="journey_id">
            Journey ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="journey_id"
            type="number"
            placeholder="e.g., 123"
            value={config.journeyId || ''}
            onChange={(e) => updateConfig('journeyId', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label>
            Portal <span className="text-destructive">*</span>
          </Label>
          <PortalSelect
            value={config.portalId || 0}
            onChange={(portalId) => updateConfig('portalId', portalId)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prop_id">
            Prop ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="prop_id"
            placeholder="e.g., pnj-reward"
            value={config.propId || ''}
            onChange={(e) => updateConfig('propId', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign_type">Campaign Type</Label>
          <Input
            id="campaign_type"
            placeholder="e.g., fortune-shake"
            value={config.campaignType || ''}
            onChange={(e) => updateConfig('campaignType', e.target.value)}
          />
        </div>
      </div>

      {/* Extra data */}
      <div className="space-y-2 pt-4 border-t">
        <Label htmlFor="extra_data">Extra Data (JSON)</Label>
        <Textarea
          id="extra_data"
          placeholder='{"utm_source": "facebook", "campaign_id": "123"}'
          className="font-mono text-sm"
          rows={4}
          value={extraValue}
          onChange={(e) => handleExtraChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          JSON object with custom key-value pairs to include in the Journey API request
        </p>
      </div>
    </div>
  )
}
