import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useApps, useCreateApp, useUpdateApp } from '@/hooks/queries'
import { createColumnHelper } from '@/lib/column-helper'
import type { App, CreateAppInput } from '@/schemas/app.schema'
import { Loader2, Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const columnHelper = createColumnHelper<App>()

interface FormData {
  appId: string
  name: string
  portalId: number
  config: string
}

const initialFormData: FormData = {
  appId: '',
  name: '',
  portalId: 0,
  config: '{}',
}

type SheetMode = 'create' | 'edit'

export function AppsPage() {
  const { data: apps = [], isLoading, error } = useApps()
  const createApp = useCreateApp()
  const updateApp = useUpdateApp()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>('create')
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const handleUpdate = useCallback(
    async (row: App, field: keyof App, value: string | number | boolean | null) => {
      await updateApp.mutateAsync({
        id: row.appId,
        data: { [field]: value },
      })
    },
    [updateApp]
  )

  const handleOpenEdit = useCallback((app: App) => {
    setFormData({
      appId: app.appId,
      name: app.name,
      portalId: app.portalId,
      config: JSON.stringify(app.config ?? {}, null, 2),
    })
    setSheetMode('edit')
    setSheetOpen(true)
  }, [])

  const columns = useMemo(
    () => [
      columnHelper.stacked('app', 'App', {
        primary: (row) => row.name,
        secondary: (row) => row.appId,
        onClick: handleOpenEdit,
      }),
      columnHelper.editable.number(
        'portalId',
        'Portal ID',
        (row, value) => handleUpdate(row, 'portalId', value),
        {
          min: 0,
        }
      ),
      columnHelper.date('createdAt', 'Created'),
      columnHelper.editable.toggle('isActive', 'Status', (row, value) =>
        handleUpdate(row, 'isActive', value)
      ),
    ],
    [handleUpdate, handleOpenEdit]
  )

  const handleOpenCreate = () => {
    setFormData(initialFormData)
    setSheetMode('create')
    setSheetOpen(true)
  }

  const handleClose = () => {
    setSheetOpen(false)
    setFormData(initialFormData)
  }

  const handleSave = async () => {
    if (!formData.appId || !formData.name) return

    let config: Record<string, unknown> = {}
    try {
      config = JSON.parse(formData.config)
    } catch {
      // Invalid JSON, keep empty object
    }

    if (sheetMode === 'create') {
      await createApp.mutateAsync({
        appId: formData.appId,
        name: formData.name,
        portalId: formData.portalId,
        config,
      } as CreateAppInput)
    } else {
      await updateApp.mutateAsync({
        id: formData.appId,
        data: {
          name: formData.name,
          portalId: formData.portalId,
          config,
        },
      })
    }

    handleClose()
  }

  const isEditing = sheetMode === 'edit'
  const isSaving = createApp.isPending || updateApp.isPending

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">
          Failed to load apps: {error.message}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Apps</CardTitle>
              <CardDescription>Manage apps that can have games linked to them</CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New App
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={apps}
            loading={isLoading}
            emptyMessage="No apps yet. Create your first app."
          />
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit App' : 'Create App'}</SheetTitle>
            <SheetDescription>
              {isEditing ? 'Update app details' : 'Create a new app to link games to'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-auto px-4">
            <div className="space-y-2">
              <Label htmlFor="appId">
                App ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="appId"
                placeholder="e.g., my-app-001"
                value={formData.appId}
                onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                className="font-mono"
                disabled={isEditing}
              />
              <p className="text-xs text-muted-foreground">Unique identifier for the app</p>
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
            <div className="space-y-2">
              <Label htmlFor="portalId">Portal ID</Label>
              <Input
                id="portalId"
                type="number"
                placeholder="0"
                value={formData.portalId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, portalId: parseInt(e.target.value) || 0 })
                }
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
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.appId || !formData.name || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create App'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
