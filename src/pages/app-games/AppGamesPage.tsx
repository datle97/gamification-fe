import { useState } from 'react'
import dayjs from 'dayjs'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useApps } from '@/hooks/useApps'
import { useGames } from '@/hooks/useGames'
import { useLinks, useCreateLink, useDeleteLink } from '@/hooks/useLinks'
import type { Link } from '@/schemas/link.schema'
import type { GameStatus } from '@/schemas/game.schema'

const statusVariants: Record<GameStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  draft: 'outline',
  paused: 'secondary',
  ended: 'destructive',
}

const columns: ColumnDef<Link>[] = [
  {
    accessorKey: 'app',
    header: 'App',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.app?.name || '-'}</div>
        <div className="text-xs text-muted-foreground font-mono">{row.original.appId}</div>
      </div>
    ),
  },
  {
    accessorKey: 'game',
    header: 'Game',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.game?.name || '-'}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {row.original.game?.code || row.original.gameId}
        </div>
      </div>
    ),
  },
  {
    id: 'gameStatus',
    header: 'Game Status',
    cell: ({ row }) => {
      const status = row.original.game?.status as GameStatus | undefined
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
    id: 'gameSchedule',
    header: 'Schedule',
    cell: ({ row }) => {
      const game = row.original.game
      if (!game?.startAt && !game?.endAt) {
        return <span className="text-muted-foreground">-</span>
      }
      return (
        <div className="text-sm text-muted-foreground">
          {game.startAt ? dayjs(game.startAt).format('YYYY-MM-DD') : '∞'}
          {' → '}
          {game.endAt ? dayjs(game.endAt).format('YYYY-MM-DD') : '∞'}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Linked At',
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

type SheetMode = 'closed' | 'create' | 'view'

export function AppGamesPage() {
  const { data: links = [], isLoading, error } = useLinks()
  const { data: apps = [], isLoading: appsLoading } = useApps()
  const { data: games = [], isLoading: gamesLoading } = useGames()
  const createLink = useCreateLink()
  const deleteLink = useDeleteLink()

  const [sheetMode, setSheetMode] = useState<SheetMode>('closed')
  const [selectedLink, setSelectedLink] = useState<Link | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleOpenCreate = () => {
    setSheetMode('create')
    setSelectedLink(null)
    setSelectedAppId('')
    setSelectedGameId('')
  }

  const handleRowClick = (link: Link) => {
    setSheetMode('view')
    setSelectedLink(link)
  }

  const handleClose = () => {
    setSheetMode('closed')
    setSelectedLink(null)
    setSelectedAppId('')
    setSelectedGameId('')
  }

  const handleCreate = async () => {
    if (!selectedAppId || !selectedGameId) return

    await createLink.mutateAsync({
      appId: selectedAppId,
      gameId: selectedGameId,
    })

    handleClose()
  }

  const handleDelete = async () => {
    if (!selectedLink) return

    await deleteLink.mutateAsync({
      appId: selectedLink.appId,
      gameId: selectedLink.gameId,
    })

    setShowDeleteDialog(false)
    handleClose()
  }

  const isCreate = sheetMode === 'create'
  const selectsLoading = appsLoading || gamesLoading

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">
          Failed to load app games: {error.message}
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
              <CardTitle>App Games</CardTitle>
              <CardDescription>
                Link games to apps. Game settings (status, schedule) are managed in the Games page.
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Link Game
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <p>No app-game links yet. Link a game to an app to create a campaign.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={links} onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetMode !== 'closed'} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{isCreate ? 'Link Game to App' : 'Link Details'}</SheetTitle>
            <SheetDescription>
              {isCreate
                ? 'Select an app and a game to create a link'
                : 'View app-game link details'}
            </SheetDescription>
          </SheetHeader>

          {isCreate ? (
            <div className="flex-1 space-y-4 overflow-auto px-4">
              <div className="space-y-2">
                <Label htmlFor="app">App</Label>
                <Select
                  value={selectedAppId}
                  onValueChange={setSelectedAppId}
                  disabled={selectsLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select app" />
                  </SelectTrigger>
                  <SelectContent>
                    {apps.map((app) => (
                      <SelectItem key={app.appId} value={app.appId}>
                        {app.name}
                        <span className="ml-2 text-xs text-muted-foreground font-mono">
                          ({app.appId})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="game">Game</Label>
                <Select
                  value={selectedGameId}
                  onValueChange={setSelectedGameId}
                  disabled={selectsLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((game) => (
                      <SelectItem key={game.gameId} value={game.gameId}>
                        {game.name}
                        <span className="ml-2 text-xs text-muted-foreground font-mono">
                          ({game.code})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            selectedLink && (
              <div className="flex-1 space-y-4 overflow-auto px-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">App</Label>
                  <p className="font-medium">{selectedLink.app?.name || '-'}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedLink.appId}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Game</Label>
                  <p className="font-medium">{selectedLink.game?.name || '-'}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedLink.game?.code || selectedLink.gameId}
                  </p>
                </div>
                {selectedLink.game && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Game Status</Label>
                      <div>
                        <Badge
                          variant={statusVariants[selectedLink.game.status as GameStatus]}
                          className="capitalize"
                        >
                          {selectedLink.game.status}
                        </Badge>
                      </div>
                    </div>
                    {(selectedLink.game.startAt || selectedLink.game.endAt) && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Schedule</Label>
                        <p className="text-sm">
                          {selectedLink.game.startAt
                            ? dayjs(selectedLink.game.startAt).format('MMMM D, YYYY')
                            : 'No start'}
                          {' → '}
                          {selectedLink.game.endAt
                            ? dayjs(selectedLink.game.endAt).format('MMMM D, YYYY')
                            : 'No end'}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Linked At</Label>
                  <p className="text-sm">
                    {selectedLink.createdAt
                      ? dayjs(selectedLink.createdAt).format('MMMM D, YYYY')
                      : '-'}
                  </p>
                </div>
              </div>
            )
          )}

          <SheetFooter>
            <Button variant="outline" onClick={handleClose}>
              {isCreate ? 'Cancel' : 'Close'}
            </Button>
            {isCreate ? (
              <Button
                onClick={handleCreate}
                disabled={!selectedAppId || !selectedGameId || createLink.isPending}
              >
                {createLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Link
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Unlink
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Game from App?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link between "{selectedLink?.app?.name}" and "
              {selectedLink?.game?.name}". The game itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
