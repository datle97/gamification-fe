import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NoRewardHandlerFormProps {
  config: string
  onChange: (config: string) => void
}

export function NoRewardHandlerForm({ config, onChange }: NoRewardHandlerFormProps) {
  const getMessage = () => {
    try {
      const cfg = JSON.parse(config)
      return cfg.message || ''
    } catch {
      return ''
    }
  }

  const updateMessage = (message: string) => {
    try {
      const cfg = JSON.parse(config)
      cfg.message = message
      onChange(JSON.stringify(cfg, null, 2))
    } catch {
      // Initialize if invalid JSON
      onChange(
        JSON.stringify(
          {
            type: 'no_reward',
            message,
          },
          null,
          2
        )
      )
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">No Reward Configuration</h4>
      <div className="space-y-2">
        <Label htmlFor="message">Display Message (Optional)</Label>
        <Input
          id="message"
          placeholder="e.g., Better luck next time!"
          value={getMessage()}
          onChange={(e) => updateMessage(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          This represents a "no win" outcome. You can optionally set a message to display.
        </p>
      </div>
    </div>
  )
}
