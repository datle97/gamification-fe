import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  draft: 'outline',
  paused: 'secondary',
  ended: 'secondary',
}

const statusOptions = ['active', 'draft', 'paused', 'ended'] as const

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
    cell: function StatusCell({ row }) {
      const status = row.getValue('status') as string

      const handleStatusChange = (newStatus: string) => {
        // Will be replaced with API call
        console.log('Changing status to:', newStatus)
      }

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-auto w-auto border-0 bg-background! px-0 py-0 shadow-none hover:bg-transparent focus:ring-0">
              <span className="sr-only"><SelectValue /></span>
              <Badge variant={statusVariants[status] || 'secondary'} className="capitalize rounded-sm">
                {status}
              </Badge>
            </SelectTrigger>
            <SelectContent align="start">
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="capitalize">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
]

export function AppGamesPage() {
  const appGames = mockAppGames // Will be replaced with API data
  const [selectedAppGame, setSelectedAppGame] = useState<AppGame | null>(null)
  const [editedAppGame, setEditedAppGame] = useState<AppGame | null>(null)

  const handleRowClick = (appGame: AppGame) => {
    setSelectedAppGame(appGame)
    setEditedAppGame({ ...appGame })
  }

  const handleSave = () => {
    // Will be replaced with API call
    console.log('Saving app game:', editedAppGame)
    setSelectedAppGame(null)
    setEditedAppGame(null)
  }

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
            <DataTable columns={columns} data={appGames} onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedAppGame} onOpenChange={(open) => !open && setSelectedAppGame(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Campaign Details</SheetTitle>
            <SheetDescription>
              View and edit app-game link settings
            </SheetDescription>
          </SheetHeader>
          {editedAppGame && (
            <div className="flex-1 space-y-4 overflow-auto px-4">
              <div className="space-y-2">
                <Label>App</Label>
                <Input value={editedAppGame.appName} disabled />
                <p className="text-xs text-muted-foreground font-mono">{editedAppGame.appId}</p>
              </div>
              <div className="space-y-2">
                <Label>Game</Label>
                <Input value={editedAppGame.gameName} disabled />
                <p className="text-xs text-muted-foreground font-mono">{editedAppGame.gameCode}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedAppGame.status}
                  onValueChange={(value) => setEditedAppGame({ ...editedAppGame, status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={editedAppGame.startDate}
                    onChange={(e) => setEditedAppGame({ ...editedAppGame, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={editedAppGame.endDate}
                    onChange={(e) => setEditedAppGame({ ...editedAppGame, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setSelectedAppGame(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
