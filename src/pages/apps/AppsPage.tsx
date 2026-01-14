import { useState } from 'react'
import dayjs from 'dayjs'
import { Plus, Loader2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useApps, useCreateApp, useUpdateApp } from '@/hooks/useApps'
import type { App, CreateAppInput } from '@/schemas/app.schema'

const columns: ColumnDef<App>[] = [
  {
    accessorKey: 'appId',
    header: 'App ID',
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('appId')}</span>,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'portalId',
    header: 'Portal ID',
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
      return (
        <span className="text-muted-foreground">
          {date ? dayjs(date).format('YYYY-MM-DD') : '-'}
        </span>
      )
    },
  },
]

type SheetMode = 'closed' | 'create' | 'edit'

interface FormData {
  appId: string
  name: string
  portalId: number
  isActive: boolean
}

const initialFormData: FormData = {
  appId: '',
  name: '',
  portalId: 0,
  isActive: true,
}

export function AppsPage() {
  const { data: apps = [], isLoading, error } = useApps()
  const createApp = useCreateApp()
  const updateApp = useUpdateApp()

  const [sheetMode, setSheetMode] = useState<SheetMode>('closed')
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const handleOpenCreate = () => {
    setSheetMode('create')
    setSelectedApp(null)
    setFormData(initialFormData)
  }

  const handleRowClick = (app: App) => {
    setSheetMode('edit')
    setSelectedApp(app)
    setFormData({
      appId: app.appId,
      name: app.name,
      portalId: app.portalId,
      isActive: app.isActive ?? true,
    })
  }

  const handleClose = () => {
    setSheetMode('closed')
    setSelectedApp(null)
    setFormData(initialFormData)
  }

  const handleSave = async () => {
    if (!formData.appId || !formData.name) return

    if (sheetMode === 'create') {
      await createApp.mutateAsync({
        appId: formData.appId,
        name: formData.name,
        portalId: formData.portalId,
      } as CreateAppInput)
    } else if (sheetMode === 'edit' && selectedApp) {
      await updateApp.mutateAsync({
        id: selectedApp.appId,
        data: {
          name: formData.name,
          portalId: formData.portalId,
          isActive: formData.isActive,
        },
      })
    }

    handleClose()
  }

  const isPending = createApp.isPending || updateApp.isPending
  const isCreate = sheetMode === 'create'

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
            <DataTable columns={columns} data={apps} onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetMode !== 'closed'} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{isCreate ? 'Create App' : 'Edit App'}</SheetTitle>
            <SheetDescription>
              {isCreate ? 'Create a new app to link games to' : `Editing: ${selectedApp?.appId}`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-auto px-4">
            <div className="space-y-2">
              <Label htmlFor="appId">App ID</Label>
              <Input
                id="appId"
                placeholder="e.g., my-app-001"
                value={formData.appId}
                onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                disabled={!isCreate}
                className="font-mono"
              />
              {isCreate && (
                <p className="text-xs text-muted-foreground">Unique identifier for the app</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
            {!isCreate && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
              </div>
            )}
            {!isCreate && selectedApp?.createdAt && (
              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">
                  {dayjs(selectedApp.createdAt).format('MMMM D, YYYY')}
                </p>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.appId || !formData.name || isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isCreate ? 'Create App' : 'Save changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
