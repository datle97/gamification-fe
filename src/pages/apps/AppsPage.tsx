import {
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  UnsavedChangesSheet,
  UnsavedChangesSheetContent,
} from '@/components/common/unsaved-changes-sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useApps, useCreateApp, useUpdateApp } from '@/hooks/queries'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { createColumnHelper } from '@/lib/column-helper'
import type { App, CreateAppInput } from '@/schemas/app.schema'
import { Loader2, Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

const columnHelper = createColumnHelper<App>()

interface FormData {
  appId: string
  name: string
  description: string
  config: string
  metadata: string
}

const initialFormData: FormData = {
  appId: '',
  name: '',
  description: '',
  config: '{}',
  metadata: '{}',
}

export function AppsPage() {
  const { data: apps = [], isLoading, error } = useApps()
  const createApp = useCreateApp()
  const updateApp = useUpdateApp()
  const navigate = useNavigate()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [sheetInitialData, setSheetInitialData] = useState<FormData>(initialFormData)

  const { isDirty } = useUnsavedChanges({
    data: formData,
    initialData: sheetOpen ? sheetInitialData : undefined,
  })

  const handleUpdate = useCallback(
    async (row: App, field: keyof App, value: string | number | boolean | null) => {
      await updateApp.mutateAsync({
        id: row.appId,
        data: { [field]: value },
      })
    },
    [updateApp]
  )

  const columns = useMemo(
    () => [
      columnHelper.stacked('app', 'App', {
        primary: (row) => row.name,
        secondary: (row) => row.appId,
        onClick: (app) => navigate(`/apps/${app.appId}`),
      }),
      columnHelper.date('createdAt', 'Created'),
      columnHelper.editable.toggle('isActive', 'Status', (row, value) =>
        handleUpdate(row, 'isActive', value)
      ),
    ],
    [handleUpdate, navigate]
  )

  const handleOpenCreate = () => {
    setFormData(initialFormData)
    setSheetInitialData(initialFormData)
    setSheetOpen(true)
  }

  const handleClose = () => {
    setSheetOpen(false)
    setFormData(initialFormData)
  }

  const handleSave = async () => {
    if (!formData.appId || !formData.name) return

    let config: Record<string, unknown> = {}
    let metadata: Record<string, unknown> = {}
    try {
      config = JSON.parse(formData.config)
    } catch {
      // Invalid JSON, keep empty object
    }
    try {
      metadata = JSON.parse(formData.metadata)
    } catch {
      // Invalid JSON, keep empty object
    }

    await createApp.mutateAsync({
      appId: formData.appId,
      name: formData.name,
      description: formData.description,
      config,
      metadata,
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
          <CardTitle>Apps</CardTitle>
          <CardDescription>Manage apps that can have games linked to them</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId="apps-list"
            columns={columns}
            data={apps}
            loading={isLoading}
            emptyMessage="No apps yet. Create your first app."
            enableSorting
            enableSearch
            searchPlaceholder="Search apps..."
            actions={[
              {
                label: 'New App',
                icon: Plus,
                onClick: handleOpenCreate,
                variant: 'default',
              },
            ]}
          />
        </CardContent>
      </Card>

      <UnsavedChangesSheet
        open={sheetOpen}
        onOpenChange={(open) => !open && handleClose()}
        isDirty={isDirty}
      >
        <UnsavedChangesSheetContent className="sm:max-w-lg">
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
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={!formData.appId || !formData.name || createApp.isPending}>
              {createApp.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create App
            </Button>
          </SheetFooter>
        </UnsavedChangesSheetContent>
      </UnsavedChangesSheet>
    </div>
  )
}
