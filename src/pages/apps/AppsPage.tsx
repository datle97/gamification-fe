import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface App {
  id: string
  portalId: number
  name: string
  isActive: boolean
  createdAt: string
}

// Mock data for demo
const mockApps: App[] = [
  {
    id: 'ggg-ma-dao',
    portalId: 12345,
    name: 'GGG Ma Đạo Campaign',
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'phuc-long-tet',
    portalId: 12346,
    name: 'Phúc Long Tết 2024',
    isActive: true,
    createdAt: '2024-01-10',
  },
  {
    id: 'highlands-summer',
    portalId: 12347,
    name: 'Highlands Summer Promo',
    isActive: false,
    createdAt: '2024-01-05',
  },
]

const columns: ColumnDef<App>[] = [
  {
    accessorKey: 'id',
    header: 'App ID',
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue('id')}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
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
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('createdAt')}</span>
    ),
  },
]

export function AppsPage() {
  const apps = mockApps // Will be replaced with API data
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [editedApp, setEditedApp] = useState<App | null>(null)

  const handleRowClick = (app: App) => {
    setSelectedApp(app)
    setEditedApp({ ...app })
  }

  const handleSave = () => {
    // Will be replaced with API call
    console.log('Saving app:', editedApp)
    setSelectedApp(null)
    setEditedApp(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Apps</CardTitle>
              <CardDescription>
                Manage apps that can have games linked to them
              </CardDescription>
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
          {apps.length === 0 ? (
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
            <SheetDescription>
              View and edit app information
            </SheetDescription>
          </SheetHeader>
          {editedApp && (
            <div className="flex-1 space-y-4 overflow-auto px-4">
              <div className="space-y-2">
                <Label htmlFor="id">App ID</Label>
                <Input
                  id="id"
                  value={editedApp.id}
                  disabled
                  className="font-mono"
                />
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
                  onChange={(e) => setEditedApp({ ...editedApp, portalId: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={editedApp.isActive}
                  onCheckedChange={(checked) => setEditedApp({ ...editedApp, isActive: !!checked })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>
              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">{editedApp.createdAt}</p>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setSelectedApp(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
