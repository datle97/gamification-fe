import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TurnRewardConfig } from '@/schemas/reward.schema'

interface TurnHandlerFormProps {
  config: TurnRewardConfig
  onChange: (config: TurnRewardConfig) => void
}

export function TurnHandlerForm({ config, onChange }: TurnHandlerFormProps) {
  const updateConfig = <K extends keyof TurnRewardConfig>(
    key: K,
    value: TurnRewardConfig[K] | undefined
  ) => {
    const newConfig = { ...config }
    if (value === undefined || value === 0) {
      delete newConfig[key]
    } else {
      newConfig[key] = value
    }
    onChange(newConfig)
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Turn Reward Configuration</h4>
      <div className="space-y-2">
        <Label htmlFor="turn_amount">
          Amount <span className="text-destructive">*</span>
        </Label>
        <Input
          id="turn_amount"
          type="number"
          min={1}
          placeholder="Number of turns to grant"
          value={config.amount || ''}
          onChange={(e) => updateConfig('amount', parseInt(e.target.value) || 1)}
        />
        <p className="text-xs text-muted-foreground">Number of game turns to grant to the user</p>
      </div>
    </div>
  )
}
