import { useState } from 'react'
import { Plus, ExternalLink } from 'lucide-react'
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

interface Game {
  code: string
  name: string
  type: string
  templateUrl: string
  createdAt: string
}

// Mock data for demo
const mockGames: Game[] = [
  {
    code: 'golden-horse',
    name: 'Golden Horse Spin',
    type: 'spin',
    templateUrl: 'https://games.example.com/golden-horse',
    createdAt: '2024-01-15',
  },
  {
    code: 'lucky-scratch',
    name: 'Lucky Scratch Card',
    type: 'scratch',
    templateUrl: 'https://games.example.com/lucky-scratch',
    createdAt: '2024-01-10',
  },
  {
    code: 'trivia-master',
    name: 'Trivia Master Quiz',
    type: 'quiz',
    templateUrl: 'https://games.example.com/trivia-master',
    createdAt: '2024-01-05',
  },
]

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
    cell: ({ row }) => (
      <Badge variant="secondary" className="capitalize">
        {row.getValue('type')}
      </Badge>
    ),
  },
  {
    accessorKey: 'templateUrl',
    header: 'Template',
    cell: ({ row }) => (
      <a
        href={row.getValue('templateUrl')}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Open
      </a>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('createdAt')}</span>
    ),
  },
]

const gameTypes = ['spin', 'scratch', 'quiz', 'puzzle', 'match'] as const

export function GamesPage() {
  const games = mockGames // Will be replaced with API data
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [editedGame, setEditedGame] = useState<Game | null>(null)

  const handleRowClick = (game: Game) => {
    setSelectedGame(game)
    setEditedGame({ ...game })
  }

  const handleSave = () => {
    // Will be replaced with API call
    console.log('Saving game:', editedGame)
    setSelectedGame(null)
    setEditedGame(null)
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
          {games.length === 0 ? (
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
                  value={editedGame.type}
                  onValueChange={(value) => setEditedGame({ ...editedGame, type: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
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
                  value={editedGame.templateUrl}
                  onChange={(e) => setEditedGame({ ...editedGame, templateUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">{editedGame.createdAt}</p>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setSelectedGame(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
