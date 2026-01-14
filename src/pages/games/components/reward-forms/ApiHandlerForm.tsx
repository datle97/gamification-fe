import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface ApiHandlerFormProps {
  config: string
  onChange: (config: string) => void
}

export function ApiHandlerForm({ config, onChange }: ApiHandlerFormProps) {
  const getConfigValue = (key: string) => {
    try {
      const cfg = JSON.parse(config)
      return cfg[key] || ''
    } catch {
      return ''
    }
  }

  const updateConfig = (key: string, value: string) => {
    try {
      const cfg = JSON.parse(config)
      cfg[key] = value
      onChange(JSON.stringify(cfg, null, 2))
    } catch {
      // Initialize if invalid JSON
      if (key === 'url') {
        onChange(
          JSON.stringify(
            {
              type: 'api',
              url: value,
              method: 'POST',
              headers: {},
              body: {},
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
      <h4 className="text-sm font-semibold">API Handler Configuration</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="api_url">
            API URL <span className="text-destructive">*</span>
          </Label>
          <Input
            id="api_url"
            placeholder="https://api.example.com/reward"
            value={getConfigValue('url')}
            onChange={(e) => updateConfig('url', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="api_method">HTTP Method</Label>
          <Select
            value={getConfigValue('method') || 'POST'}
            onValueChange={(value) => updateConfig('method', value)}
          >
            <SelectTrigger id="api_method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="api_headers">Headers (JSON)</Label>
        <Textarea
          id="api_headers"
          placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
          value={
            typeof getConfigValue('headers') === 'object'
              ? JSON.stringify(getConfigValue('headers'), null, 2)
              : getConfigValue('headers')
          }
          onChange={(e) => updateConfig('headers', e.target.value)}
          className="font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="api_body">Request Body (JSON)</Label>
        <Textarea
          id="api_body"
          placeholder='{"userId": "{{userId}}", "rewardId": "{{rewardId}}"}'
          value={
            typeof getConfigValue('body') === 'object'
              ? JSON.stringify(getConfigValue('body'), null, 2)
              : getConfigValue('body')
          }
          onChange={(e) => updateConfig('body', e.target.value)}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use template variables like {`{{userId}}`} or {`{{rewardId}}`} for dynamic values
        </p>
      </div>
    </div>
  )
}
