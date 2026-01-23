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
import type { ApiRewardConfig } from '@/schemas/reward.schema'
import { useState } from 'react'

interface ApiHandlerFormProps {
  config: ApiRewardConfig
  onChange: (config: ApiRewardConfig) => void
}

export function ApiHandlerForm({ config, onChange }: ApiHandlerFormProps) {
  // Local state for JSON text fields (to handle invalid JSON during typing)
  const [headersText, setHeadersText] = useState(() =>
    config.api?.headers ? JSON.stringify(config.api.headers, null, 2) : ''
  )
  const [dataText, setDataText] = useState(() =>
    config.api?.data ? JSON.stringify(config.api.data, null, 2) : ''
  )

  const updateApi = <K extends keyof ApiRewardConfig['api']>(
    key: K,
    value: ApiRewardConfig['api'][K] | undefined
  ) => {
    const newApi = { ...config.api }
    if (value === undefined || value === '') {
      delete newApi[key]
    } else {
      newApi[key] = value as ApiRewardConfig['api'][K]
    }
    onChange({ ...config, api: newApi })
  }

  const handleHeadersChange = (value: string) => {
    setHeadersText(value)
    try {
      const parsed = value.trim() ? JSON.parse(value) : undefined
      updateApi('headers', parsed)
    } catch {
      // Invalid JSON, keep local state but don't update config
    }
  }

  const handleDataChange = (value: string) => {
    setDataText(value)
    try {
      const parsed = value.trim() ? JSON.parse(value) : undefined
      updateApi('data', parsed)
    } catch {
      // Invalid JSON, keep local state but don't update config
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">API Handler Configuration</h4>

      <div className="space-y-2">
        <Label htmlFor="api_provider">Provider</Label>
        <Input
          id="api_provider"
          placeholder="e.g., journey, gift-api"
          value={config.provider || ''}
          onChange={(e) => onChange({ ...config, provider: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="api_url">
            API URL <span className="text-destructive">*</span>
          </Label>
          <Input
            id="api_url"
            placeholder="https://api.example.com/reward"
            value={config.api?.url || ''}
            onChange={(e) => updateApi('url', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="api_method">HTTP Method</Label>
          <Select
            value={config.api?.method || 'POST'}
            onValueChange={(value) => updateApi('method', value as 'GET' | 'POST')}
          >
            <SelectTrigger id="api_method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api_headers">Headers (JSON)</Label>
        <Textarea
          id="api_headers"
          placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
          value={headersText}
          onChange={(e) => handleHeadersChange(e.target.value)}
          className="font-mono text-sm"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="api_data">Request Body (JSON)</Label>
        <Textarea
          id="api_data"
          placeholder='{"userId": "{{userId}}", "rewardId": "{{rewardId}}"}'
          value={dataText}
          onChange={(e) => handleDataChange(e.target.value)}
          className="font-mono text-sm"
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Use template variables like {`{{userId}}`} or {`{{rewardId}}`} for dynamic values
        </p>
      </div>
    </div>
  )
}
