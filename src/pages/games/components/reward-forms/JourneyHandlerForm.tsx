import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface JourneyHandlerFormProps {
  config: string
  onChange: (config: string) => void
}

export function JourneyHandlerForm({ config, onChange }: JourneyHandlerFormProps) {
  const getConfigValue = (key: string) => {
    try {
      const cfg = JSON.parse(config)
      return cfg[key] || ''
    } catch {
      return ''
    }
  }

  const updateConfig = (key: string, value: string | number) => {
    try {
      const cfg = JSON.parse(config)
      cfg[key] = value
      onChange(JSON.stringify(cfg, null, 2))
    } catch {
      // Initialize if invalid JSON
      if (key === 'journeyId') {
        onChange(
          JSON.stringify(
            {
              type: 'journey',
              journeyId: typeof value === 'number' ? value : 0,
              portalId: 0,
              propId: '',
              campaignType: '',
            },
            null,
            2
          )
        )
      }
    }
  }

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
            value={getConfigValue('journeyId')}
            onChange={(e) => updateConfig('journeyId', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portal_id">
            Portal ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="portal_id"
            type="number"
            placeholder="e.g., 1"
            value={getConfigValue('portalId')}
            onChange={(e) => updateConfig('portalId', parseInt(e.target.value) || 0)}
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
            value={getConfigValue('propId')}
            onChange={(e) => updateConfig('propId', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign_type">Campaign Type</Label>
          <Input
            id="campaign_type"
            placeholder="e.g., fortune-shake"
            value={getConfigValue('campaignType')}
            onChange={(e) => updateConfig('campaignType', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
