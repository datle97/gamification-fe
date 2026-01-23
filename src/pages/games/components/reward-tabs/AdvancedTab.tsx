import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ExpirationConfig, RewardConfig } from '@/schemas/reward.schema'
import { useState } from 'react'

interface AdvancedTabProps {
  config: RewardConfig
  conditions: string
  shareConfig: string
  expirationConfig: ExpirationConfig | null
  onChange: (
    field: 'config' | 'conditions' | 'shareConfig' | 'expirationConfig',
    value: RewardConfig | ExpirationConfig | null | string
  ) => void
}

export function AdvancedTab({
  config,
  conditions,
  shareConfig,
  expirationConfig,
  onChange,
}: AdvancedTabProps) {
  // Local state for JSON text (to handle invalid JSON during typing)
  const [configText, setConfigText] = useState(() => JSON.stringify(config, null, 2))
  const [expirationText, setExpirationText] = useState(() =>
    expirationConfig ? JSON.stringify(expirationConfig, null, 2) : ''
  )

  const handleConfigChange = (value: string) => {
    setConfigText(value)
    try {
      const parsed = value.trim() ? JSON.parse(value) : { type: 'system' }
      onChange('config', parsed)
    } catch {
      // Invalid JSON, keep local state but don't update parent
    }
  }

  const handleExpirationChange = (value: string) => {
    setExpirationText(value)
    try {
      const parsed = value.trim() ? JSON.parse(value) : null
      onChange('expirationConfig', parsed)
    } catch {
      // Invalid JSON, keep local state but don't update parent
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="config">Config (JSON)</Label>
        <Textarea
          id="config"
          placeholder='{"type": "system"}'
          value={configText}
          onChange={(e) => handleConfigChange(e.target.value)}
          className="min-h-32 font-mono text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="conditions_json">Conditions (JSON)</Label>
        <Textarea
          id="conditions_json"
          placeholder='{"uniqueness": {"maxPerUser": 1}}'
          value={conditions}
          onChange={(e) => onChange('conditions', e.target.value)}
          className="min-h-24 font-mono text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shareConfig_json">Share Config (JSON)</Label>
        <Textarea
          id="shareConfig_json"
          placeholder='{"enabled": true}'
          value={shareConfig}
          onChange={(e) => onChange('shareConfig', e.target.value)}
          className="min-h-20 font-mono text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expirationConfig">Expiration Config (JSON)</Label>
        <Textarea
          id="expirationConfig"
          placeholder='{"mode": "ttl", "value": 30, "unit": "day"}'
          value={expirationText}
          onChange={(e) => handleExpirationChange(e.target.value)}
          className="min-h-20 font-mono text-xs"
        />
      </div>
    </div>
  )
}
