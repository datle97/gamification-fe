/* eslint-disable @typescript-eslint/no-unused-vars */
import type { SystemRewardConfig } from '@/schemas/reward.schema'

interface SystemHandlerFormProps {
  config: SystemRewardConfig
  onChange: (config: SystemRewardConfig) => void
}

export function SystemHandlerForm({
  config: _config,
  onChange: _onChange,
}: SystemHandlerFormProps) {
  // System handler has minimal config - just ensure type is set
  // No user-editable fields needed

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          System handler allocates rewards internally without external API calls. Minimal
          configuration required.
        </p>
      </div>
    </div>
  )
}
