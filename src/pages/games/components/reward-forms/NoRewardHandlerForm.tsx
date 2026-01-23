import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NoRewardConfig } from '@/schemas/reward.schema'

interface NoRewardHandlerFormProps {
  config: NoRewardConfig
  onChange: (config: NoRewardConfig) => void
}

export function NoRewardHandlerForm({ config, onChange }: NoRewardHandlerFormProps) {
  const updateConfig = <K extends keyof NoRewardConfig>(
    key: K,
    value: NoRewardConfig[K] | undefined
  ) => {
    const newConfig = { ...config }
    if (value === undefined || value === '') {
      delete newConfig[key]
    } else {
      newConfig[key] = value
    }
    onChange(newConfig)
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">No Reward Configuration</h4>
      <div className="space-y-2">
        <Label htmlFor="message">Display Message (Optional)</Label>
        <Input
          id="message"
          placeholder="e.g., Better luck next time!"
          value={config.message || ''}
          onChange={(e) => updateConfig('message', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          This represents a "no win" outcome. You can optionally set a message to display.
        </p>
      </div>
    </div>
  )
}
