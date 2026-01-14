import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TurnHandlerFormProps {
  config: string
  onChange: (config: string) => void
}

export function TurnHandlerForm({ config, onChange }: TurnHandlerFormProps) {
  const getAmount = () => {
    try {
      const cfg = JSON.parse(config)
      return cfg.amount || ''
    } catch {
      return ''
    }
  }

  const handleAmountChange = (value: string) => {
    try {
      const cfg = JSON.parse(config)
      cfg.amount = parseInt(value) || 1
      onChange(JSON.stringify(cfg, null, 2))
    } catch {
      onChange(JSON.stringify({ type: 'turn', amount: parseInt(value) || 1 }, null, 2))
    }
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
          value={getAmount()}
          onChange={(e) => handleAmountChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Number of game turns to grant to the user</p>
      </div>
    </div>
  )
}
