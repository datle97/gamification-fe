import { MonacoScriptEditorLoading } from '@/components/common/monaco-script-editor'
import { Label } from '@/components/ui/label'
import { Suspense, lazy } from 'react'

// Lazy load MonacoScriptEditor
const MonacoScriptEditor = lazy(() =>
  import('@/components/common/monaco-script-editor').then((m) => ({ default: m.MonacoScriptEditor }))
)

interface ScriptHandlerFormProps {
  config: string
  onChange: (config: string) => void
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
  const getScript = () => {
    try {
      const cfg = JSON.parse(config)
      return cfg.code || ''
    } catch {
      return ''
    }
  }

  const updateScript = (code: string) => {
    try {
      const cfg = JSON.parse(config)
      cfg.code = code
      onChange(JSON.stringify(cfg, null, 2))
    } catch {
      // Initialize if invalid JSON
      onChange(
        JSON.stringify(
          {
            type: 'script',
            code,
          },
          null,
          2
        )
      )
    }
  }

  const currentScript = getScript()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Script Handler Configuration</h4>
        {!currentScript && (
          <button
            type="button"
            onClick={() => updateScript(EXAMPLE_SCRIPT)}
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
        <Suspense fallback={<MonacoScriptEditorLoading height="400px" />}>
          <MonacoScriptEditor value={currentScript} onChange={updateScript} height="400px" />
        </Suspense>
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
