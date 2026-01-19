import { useState, useMemo, useCallback } from 'react'
import { Plus, Loader2 } from 'lucide-react'
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
import { createColumnHelper } from '@/lib/column-helper'
import { useApps, useCreateApp, useUpdateApp } from '@/hooks/queries'
import type { App, CreateAppInput } from '@/schemas/app.schema'

const columnHelper = createColumnHelper<App>()

interface FormData {
  appId: string
  name: string
  portalId: number
}

const initialFormData: FormData = {
  appId: '',
  name: '',
  portalId: 0,
}

export function AppsPage() {
  const { data: apps = [], isLoading, error } = useApps()
  const createApp = useCreateApp()
  const updateApp = useUpdateApp()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const handleUpdate = useCallback(
    async (row: App, field: keyof App, value: string | number | boolean) => {
      await updateApp.mutateAsync({
        id: row.appId,
        data: { [field]: value },
      })
    },
    [updateApp]
  )

  const columns = useMemo(
    () => [
      columnHelper.editable.text('name', 'Name', (row, value) => handleUpdate(row, 'name', value), {
        variant: 'primary',
      }),
      columnHelper.text('appId', 'App ID', { variant: 'secondary' }),
      columnHelper.editable.number('portalId', 'Portal ID', (row, value) => handleUpdate(row, 'portalId', value), {
        min: 0,
      }),
      columnHelper.editable.toggle('isActive', 'Status', (row, value) => handleUpdate(row, 'isActive', value), {
        defaultValue: true,
      }),
      columnHelper.date('createdAt', 'Created'),
    ],
    [handleUpdate]
  )

  const handleOpenCreate = () => {
    setFormData(initialFormData)
    setSheetOpen(true)
  }

  const handleClose = () => {
    setSheetOpen(false)
    setFormData(initialFormData)
  }

  const handleCreate = async () => {
    if (!formData.appId || !formData.name) return

    await createApp.mutateAsync({
      appId: formData.appId,
      name: formData.name,
      portalId: formData.portalId,
    } as CreateAppInput)

    handleClose()
  }

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
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apps.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <p>No apps yet. Create your first app.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={apps} />
          )}
        </CardContent>
      </Card>

      {/* Create Sheet - only for new apps */}
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Create App</SheetTitle>
            <SheetDescription>Create a new app to link games to</SheetDescription>
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
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.appId || !formData.name || createApp.isPending}
            >
              {createApp.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create App
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
