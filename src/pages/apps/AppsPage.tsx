import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
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
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/apps/${row.original.id}`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ),
  },
]

export function AppsPage() {
  const apps = mockApps // Will be replaced with API data

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
            <DataTable columns={columns} data={apps} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
