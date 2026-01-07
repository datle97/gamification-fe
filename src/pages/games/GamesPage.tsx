import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, ExternalLink, Loader2 } from 'lucide-react'
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
import { useGames, useUpdateGame } from '@/hooks/useGames'
import type { Game } from '@/schemas/game.schema'

const gameTypes = ['spin', 'scratch', 'quiz', 'puzzle', 'match', 'lottery'] as const

const columns: ColumnDef<Game>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue('code')}</span>
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
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
      return (
        <span className="text-muted-foreground">
          {date ? format(new Date(date), 'yyyy-MM-dd') : '-'}
        </span>
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
                Manage game templates that can be linked to apps
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
            <SheetDescription>
              View and edit game template information
            </SheetDescription>
          </SheetHeader>
          {editedGame && (
            <div className="flex-1 space-y-4 overflow-auto px-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={editedGame.code}
                  disabled
                  className="font-mono"
                />
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
                  onValueChange={(value) => setEditedGame({ ...editedGame, type: value as typeof gameTypes[number] })}
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
                  {editedGame.createdAt ? format(new Date(editedGame.createdAt), 'PPP') : '-'}
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
