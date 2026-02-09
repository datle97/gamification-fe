import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateApp } from '@/hooks/queries'
import type { App } from '@/schemas/app.schema'
import dayjs from 'dayjs'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface AppInfoTabProps {
  app: App
}

export function AppInfoTab({ app }: AppInfoTabProps) {
  const updateApp = useUpdateApp()

  const [formData, setFormData] = useState({
    name: app.name,
    description: app.description || '',
    config: app.config ? JSON.stringify(app.config, null, 2) : '{}',
    metadata: app.metadata ? JSON.stringify(app.metadata, null, 2) : '{}',
  })

  const parseJson = (value: string) => {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }

  const handleSave = async () => {
    await updateApp.mutateAsync({
      id: app.appId,
      data: {
        name: formData.name,
        description: formData.description,
        config: parseJson(formData.config),
        metadata: parseJson(formData.metadata),
      },
    })
  }

  const hasChanges =
    formData.name !== app.name ||
    formData.description !== (app.description || '') ||
    formData.config !== (app.config ? JSON.stringify(app.config, null, 2) : '{}') ||
    formData.metadata !== (app.metadata ? JSON.stringify(app.metadata, null, 2) : '{}')

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Information</CardTitle>
        <CardDescription>Update app details and configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="appId">App ID</Label>
            <Input id="appId" value={app.appId} disabled className="font-mono bg-muted" />
            <p className="text-xs text-muted-foreground">App ID cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="App name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="App description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="min-h-20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="config">Config (JSON)</Label>
          <Textarea
            id="config"
            placeholder="{}"
            value={formData.config}
            onChange={(e) => setFormData({ ...formData, config: e.target.value })}
            className="font-mono text-sm min-h-32"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="metadata">Metadata (JSON)</Label>
          <Textarea
            id="metadata"
            placeholder="{}"
            value={formData.metadata}
            onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
            className="font-mono text-sm min-h-32"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Created {dayjs(app.createdAt).format('MMMM D, YYYY')}
          </p>
          <Button onClick={handleSave} disabled={!hasChanges || updateApp.isPending}>
            {updateApp.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
