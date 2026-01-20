import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ScriptHandlerFormProps {
  config: string
  onChange: (config: string) => void
}

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

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Script Handler Configuration</h4>
      <div className="space-y-2">
        <Label htmlFor="script">
          JavaScript Code <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="script"
          placeholder="Enter JavaScript code to execute..."
          value={getScript()}
          onChange={(e) => updateScript(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Write custom JavaScript code that will be executed when this reward is granted
        </p>
      </div>
    </div>
  )
}
