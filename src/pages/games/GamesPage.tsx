import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
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
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
        {row.getValue('type')}
      </span>
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
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/games/${row.original.code}`}>
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

export function GamesPage() {
  const games = mockGames // Will be replaced with API data

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
            <DataTable columns={columns} data={games} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
