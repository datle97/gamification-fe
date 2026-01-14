import { useState } from 'react'
import dayjs from 'dayjs'
import { Plus, Loader2 } from 'lucide-react'
import { Link } from 'react-router'
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
import { useApps, useUpdateApp } from '@/hooks/useApps'
import type { App } from '@/schemas/app.schema'

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

export function AppsPage() {
  const { data: apps = [], isLoading, error } = useApps()
  const updateApp = useUpdateApp()

  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [editedApp, setEditedApp] = useState<App | null>(null)

  const handleRowClick = (app: App) => {
    setSelectedApp(app)
    setEditedApp({ ...app })
  }

  const handleSave = async () => {
    if (!editedApp || !selectedApp) return

    await updateApp.mutateAsync({
      id: selectedApp.appId,
      data: {
        name: editedApp.name,
        portalId: editedApp.portalId,
        isActive: editedApp.isActive,
      },
    })

    setSelectedApp(null)
    setEditedApp(null)
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
            <Button asChild>
              <Link to="/apps/new">
                <Plus className="h-4 w-4 mr-2" />
                New App
              </Link>
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

      <Sheet open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>App Details</SheetTitle>
            <SheetDescription>View and edit app information</SheetDescription>
          </SheetHeader>
          {editedApp && (
            <div className="flex-1 space-y-4 overflow-auto px-4">
              <div className="space-y-2">
                <Label htmlFor="appId">App ID</Label>
                <Input id="appId" value={editedApp.appId} disabled className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editedApp.name}
                  onChange={(e) => setEditedApp({ ...editedApp, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portalId">Portal ID</Label>
                <Input
                  id="portalId"
                  type="number"
                  value={editedApp.portalId}
                  onChange={(e) =>
                    setEditedApp({ ...editedApp, portalId: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={editedApp.isActive}
                  onCheckedChange={(checked) => setEditedApp({ ...editedApp, isActive: !!checked })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
              </div>
              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">
                  {editedApp.createdAt ? dayjs(editedApp.createdAt).format('MMMM D, YYYY') : '-'}
                </p>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setSelectedApp(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateApp.isPending}>
              {updateApp.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
