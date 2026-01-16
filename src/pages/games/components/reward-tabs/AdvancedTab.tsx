import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AdvancedTabProps {
  config: string
  conditions: string
  shareConfig: string
  expirationConfig: string
  onChange: (field: string, value: string) => void
}

export function AdvancedTab({
  config,
  conditions,
  shareConfig,
  expirationConfig,
  onChange,
}: AdvancedTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="config">Config (JSON)</Label>
        <Textarea
          id="config"
          placeholder='{"type": "system"}'
          value={config}
          onChange={(e) => onChange('config', e.target.value)}
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
          placeholder='{"mode": "ttl", "ttlDays": 30}'
          value={expirationConfig}
          onChange={(e) => onChange('expirationConfig', e.target.value)}
          className="min-h-20 font-mono text-xs"
        />
      </div>
    </div>
  )
}
