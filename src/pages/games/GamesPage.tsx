import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useCreateGame, useGames, useUpdateGame } from '@/hooks/useGames'
import type { CreateGameInput, Game, GameStatus, GameType } from '@/schemas/game.schema'
import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { ExternalLink, Loader2, Plus } from 'lucide-react'
import { useState } from 'react'

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

type SheetMode = 'closed' | 'create' | 'edit'

interface FormData {
  code: string
  name: string
  type?: GameType
  description: string
  templateUrl: string
  status: GameStatus
  startAt: string | null
  endAt: string | null
  timezone: string
}

const initialFormData: FormData = {
  code: '',
  name: '',
  type: undefined,
  description: '',
  templateUrl: '',
  status: 'draft',
  startAt: null,
  endAt: null,
  timezone: 'Asia/Ho_Chi_Minh',
}

export function GamesPage() {
  const { data: games = [], isLoading, error } = useGames()
  const createGame = useCreateGame()
  const updateGame = useUpdateGame()

  const [sheetMode, setSheetMode] = useState<SheetMode>('closed')
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const handleOpenCreate = () => {
    setSheetMode('create')
    setSelectedGame(null)
    setFormData(initialFormData)
  }

  const handleRowClick = (game: Game) => {
    setSheetMode('edit')
    setSelectedGame(game)
    setFormData({
      code: game.code,
      name: game.name,
      type: game.type,
      description: game.description || '',
      templateUrl: game.templateUrl || '',
      status: game.status || 'draft',
      startAt: game.startAt || null,
      endAt: game.endAt || null,
      timezone: game.timezone || 'Asia/Ho_Chi_Minh',
    })
  }

  const handleClose = () => {
    setSheetMode('closed')
    setSelectedGame(null)
    setFormData(initialFormData)
  }

  const handleSave = async () => {
    if (!formData.code || !formData.name) return

    if (sheetMode === 'create') {
      await createGame.mutateAsync(formData as CreateGameInput)
    } else if (sheetMode === 'edit' && selectedGame) {
      await updateGame.mutateAsync({
        id: selectedGame.gameId,
        data: {
          name: formData.name,
          type: formData.type,
          description: formData.description,
          templateUrl: formData.templateUrl,
          status: formData.status,
          startAt: formData.startAt,
          endAt: formData.endAt,
          timezone: formData.timezone,
        },
      })
    }

    handleClose()
  }

  const isPending = createGame.isPending || updateGame.isPending
  const isCreate = sheetMode === 'create'

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
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Game
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

      <Sheet open={sheetMode !== 'closed'} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{isCreate ? 'Create Game' : 'Edit Game'}</SheetTitle>
            <SheetDescription>
              {isCreate
                ? 'Create a new game template with status and schedule settings'
                : `Editing: ${selectedGame?.code}`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-auto px-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g., golden-horse"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={!isCreate}
                className="font-mono"
              />
              {isCreate && (
                <p className="text-xs text-muted-foreground">
                  Unique identifier (lowercase, hyphens only)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Game name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type || ''}
                  onValueChange={(value) => setFormData({ ...formData, type: value as GameType })}
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
                  value={formData.status || 'draft'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as GameStatus })
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <DatePicker
                  value={formData.startAt ? dayjs(formData.startAt).toDate() : undefined}
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      startAt: date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
                    })
                  }
                  placeholder="Select start date"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  value={formData.endAt ? dayjs(formData.endAt).toDate() : undefined}
                  onChange={(date) =>
                    setFormData({
                      ...formData,
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
                placeholder="https://..."
                value={formData.templateUrl}
                onChange={(e) => setFormData({ ...formData, templateUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">URL to the game render template</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Game description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-20"
              />
            </div>
            {!isCreate && selectedGame?.createdAt && (
              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">
                  {dayjs(selectedGame.createdAt).format('MMMM D, YYYY')}
                </p>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.code || !formData.name || isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isCreate ? 'Create Game' : 'Save changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
