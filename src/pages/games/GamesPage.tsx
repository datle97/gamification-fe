import { useState } from 'react'
import dayjs from 'dayjs'
import { Plus, ExternalLink, Loader2 } from 'lucide-react'
import { Link } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useGames, useUpdateGame } from '@/hooks/useGames'
import type { Game, GameStatus, GameType } from '@/schemas/game.schema'

const gameTypes: GameType[] = ['spin', 'scratch', 'quiz', 'puzzle', 'match', 'lottery']
const gameStatuses: GameStatus[] = ['draft', 'active', 'paused', 'ended']

const statusVariants: Record<GameStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  draft: 'outline',
  paused: 'secondary',
  ended: 'destructive',
}

const columns: ColumnDef<Game>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('code')}</span>,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      return type ? (
        <Badge variant="secondary" className="capitalize">
          {type}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as GameStatus
      return status ? (
        <Badge variant={statusVariants[status]} className="capitalize">
          {status}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    id: 'schedule',
    header: 'Schedule',
    cell: ({ row }) => {
      const startAt = row.original.startAt
      const endAt = row.original.endAt
      if (!startAt && !endAt) {
        return <span className="text-muted-foreground">-</span>
      }
      return (
        <div className="text-sm text-muted-foreground">
          {startAt ? dayjs(startAt).format('YYYY-MM-DD') : '∞'}
          {' → '}
          {endAt ? dayjs(endAt).format('YYYY-MM-DD') : '∞'}
        </div>
      )
    },
  },
  {
    accessorKey: 'templateUrl',
    header: 'Template',
    cell: ({ row }) => {
      const url = row.getValue('templateUrl') as string
      return url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Open
        </a>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
]

export function GamesPage() {
  const { data: games = [], isLoading, error } = useGames()
  const updateGame = useUpdateGame()

  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [editedGame, setEditedGame] = useState<Game | null>(null)

  const handleRowClick = (game: Game) => {
    setSelectedGame(game)
    setEditedGame({ ...game })
  }

  const handleSave = async () => {
    if (!editedGame || !selectedGame) return

    await updateGame.mutateAsync({
      id: selectedGame.gameId,
      data: {
        name: editedGame.name,
        type: editedGame.type,
        templateUrl: editedGame.templateUrl,
        status: editedGame.status,
        startAt: editedGame.startAt,
        endAt: editedGame.endAt,
        timezone: editedGame.timezone,
      },
    })

    setSelectedGame(null)
    setEditedGame(null)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">
          Failed to load games: {error.message}
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
              <CardTitle>Games</CardTitle>
              <CardDescription>
                Manage game templates with status and schedule settings
              </CardDescription>
            </div>
            <Button asChild>
              <Link to="/games/new">
                <Plus className="h-4 w-4 mr-2" />
                New Game
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : games.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <p>No games yet. Create your first game template.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={games} onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedGame} onOpenChange={(open) => !open && setSelectedGame(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Game Details</SheetTitle>
            <SheetDescription>View and edit game template settings</SheetDescription>
          </SheetHeader>
          {editedGame && (
            <div className="flex-1 space-y-4 overflow-auto px-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" value={editedGame.code} disabled className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editedGame.name}
                  onChange={(e) => setEditedGame({ ...editedGame, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={editedGame.type || ''}
                  onValueChange={(value) =>
                    setEditedGame({ ...editedGame, type: value as GameType })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameTypes.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedGame.status || 'draft'}
                  onValueChange={(value) =>
                    setEditedGame({ ...editedGame, status: value as GameStatus })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gameStatuses.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <DatePicker
                    value={editedGame.startAt ? dayjs(editedGame.startAt).toDate() : undefined}
                    onChange={(date) =>
                      setEditedGame({
                        ...editedGame,
                        startAt: date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
                      })
                    }
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <DatePicker
                    value={editedGame.endAt ? dayjs(editedGame.endAt).toDate() : undefined}
                    onChange={(date) =>
                      setEditedGame({
                        ...editedGame,
                        endAt: date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
                      })
                    }
                    placeholder="Select end date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateUrl">Template URL</Label>
                <Input
                  id="templateUrl"
                  value={editedGame.templateUrl || ''}
                  onChange={(e) => setEditedGame({ ...editedGame, templateUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">
                  {editedGame.createdAt ? dayjs(editedGame.createdAt).format('MMMM D, YYYY') : '-'}
                </p>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setSelectedGame(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateGame.isPending}>
              {updateGame.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
