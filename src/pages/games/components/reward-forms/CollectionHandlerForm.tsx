import type { CollectionRewardConfig } from '@/schemas/reward.schema'

interface CollectionHandlerFormProps {
  config: CollectionRewardConfig
  onChange: (config: CollectionRewardConfig) => void
}

export function CollectionHandlerForm({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config: _config,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange: _onChange,
}: CollectionHandlerFormProps) {
  // Collection handler has minimal config - just ensure type is set
  // No user-editable fields needed

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Collection Handler Configuration</h4>
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Collection rewards are managed by the collection service. No additional configuration is
          required here.
        </p>
      </div>
    </div>
  )
}
