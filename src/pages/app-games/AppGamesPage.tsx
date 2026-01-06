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

interface AppGame {
  appId: string
  gameCode: string
  appName: string
  gameName: string
  status: string
  startDate: string
  endDate: string
}

// Mock data for demo
const mockAppGames: AppGame[] = [
  {
    appId: 'ggg-ma-dao',
    gameCode: 'golden-horse',
    appName: 'GGG Ma Đạo Campaign',
    gameName: 'Golden Horse Spin',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
  },
  {
    appId: 'phuc-long-tet',
    gameCode: 'lucky-scratch',
    appName: 'Phúc Long Tết 2024',
    gameName: 'Lucky Scratch Card',
    status: 'draft',
    startDate: '2024-01-20',
    endDate: '2024-02-20',
  },
  {
    appId: 'highlands-summer',
    gameCode: 'trivia-master',
    appName: 'Highlands Summer Promo',
    gameName: 'Trivia Master Quiz',
    status: 'ended',
    startDate: '2023-06-01',
    endDate: '2023-08-31',
  },
]

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  ended: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

const columns: ColumnDef<AppGame>[] = [
  {
    accessorKey: 'appName',
    header: 'App',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.appName}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {row.original.appId}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'gameName',
    header: 'Game',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.gameName}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {row.original.gameCode}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
            statusColors[status] || statusColors.draft
          }`}
        >
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('startDate')}</span>
    ),
  },
  {
    accessorKey: 'endDate',
    header: 'End Date',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('endDate')}</span>
    ),
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/app-games/${row.original.appId}/${row.original.gameCode}`}>
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

export function AppGamesPage() {
  const appGames = mockAppGames // Will be replaced with API data

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>App Games</CardTitle>
              <CardDescription>
                Link games to apps and manage campaign settings
              </CardDescription>
            </div>
            <Button asChild>
              <Link to="/app-games/new">
                <Plus className="h-4 w-4 mr-2" />
                Link Game
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {appGames.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <p>No app-game links yet. Link a game to an app to create a campaign.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={appGames} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
