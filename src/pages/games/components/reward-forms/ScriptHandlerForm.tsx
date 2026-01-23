import { MonacoScriptEditor } from '@/components/common/lazy-monaco-script-editor'
import { Label } from '@/components/ui/label'
import type { ScriptRewardConfig } from '@/schemas/reward.schema'

interface ScriptHandlerFormProps {
  config: ScriptRewardConfig
  onChange: (config: ScriptRewardConfig) => void
}

const EXAMPLE_SCRIPT = `// Available: $context, $services, $helpers, $constants
// Type $ to see autocomplete suggestions

const percentage = $helpers.randomPercentage();

// Example: Call external API
const result = await $services.httpClient.post('https://api.example.com/grant', {
  userId: $context.auth.userId,
  rewardId: $context.reward.rewardId,
  percentage
});

if (!result.data?.success) {
  return {
    success: false,
    needsFallback: true,
    message: 'External API failed'
  };
}

return {
  success: true,
  persistedTo: 'vouchers',
  reward: {
    rewardId: $context.reward.rewardId,
    name: $context.reward.name,
    rewardValue: result.data.code,
    metadata: { provider: 'external' }
  }
};`

export function ScriptHandlerForm({ config, onChange }: ScriptHandlerFormProps) {
  const updateCode = (code: string) => {
    onChange({ ...config, code })
  }

  const currentScript = config.code || ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Script Handler Configuration</h4>
        {!currentScript && (
          <button
            type="button"
            onClick={() => updateCode(EXAMPLE_SCRIPT)}
            className="text-xs text-primary hover:underline"
          >
            Insert example
          </button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="script">
          JavaScript Code <span className="text-destructive">*</span>
        </Label>
        <MonacoScriptEditor value={currentScript} onChange={updateCode} height="400px" />
        <p className="text-xs text-muted-foreground">
          Global variables: <code className="px-1 bg-muted rounded">$context</code>,{' '}
          <code className="px-1 bg-muted rounded">$services</code>,{' '}
          <code className="px-1 bg-muted rounded">$helpers</code>,{' '}
          <code className="px-1 bg-muted rounded">$constants</code>.
        </p>
      </div>
    </div>
  )
}
