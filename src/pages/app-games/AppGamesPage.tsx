import { useState } from 'react'
import dayjs from 'dayjs'
import { Plus, Loader2, Trash2, ExternalLink } from 'lucide-react'
import { Link as RouterLink } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useLinks, useDeleteLink } from '@/hooks/useLinks'
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

export function AppGamesPage() {
  const { data: links = [], isLoading, error } = useLinks()
  const deleteLink = useDeleteLink()

  const [selectedLink, setSelectedLink] = useState<Link | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleRowClick = (link: Link) => {
    setSelectedLink(link)
  }

  const handleDelete = async () => {
    if (!selectedLink) return

    await deleteLink.mutateAsync({
      appId: selectedLink.appId,
      gameId: selectedLink.gameId,
    })

    setShowDeleteDialog(false)
    setSelectedLink(null)
  }

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
            <Button asChild>
              <RouterLink to="/app-games/new">
                <Plus className="h-4 w-4 mr-2" />
                Link Game
              </RouterLink>
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

      <Sheet open={!!selectedLink} onOpenChange={(open) => !open && setSelectedLink(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Link Details</SheetTitle>
            <SheetDescription>
              View app-game link. Edit game settings in the Games page.
            </SheetDescription>
          </SheetHeader>
          {selectedLink && (
            <div className="flex-1 space-y-4 overflow-auto px-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">App</p>
                <p className="font-medium">{selectedLink.app?.name || '-'}</p>
                <p className="text-xs text-muted-foreground font-mono">{selectedLink.appId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Game</p>
                <p className="font-medium">{selectedLink.game?.name || '-'}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedLink.game?.code || selectedLink.gameId}
                </p>
              </div>
              {selectedLink.game && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Game Status</p>
                    <Badge
                      variant={statusVariants[selectedLink.game.status as GameStatus]}
                      className="capitalize"
                    >
                      {selectedLink.game.status}
                    </Badge>
                  </div>
                  {(selectedLink.game.startAt || selectedLink.game.endAt) && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Schedule</p>
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
                <p className="text-sm font-medium text-muted-foreground">Linked At</p>
                <p className="text-sm">
                  {selectedLink.createdAt
                    ? dayjs(selectedLink.createdAt).format('MMMM D, YYYY')
                    : '-'}
                </p>
              </div>
              <div className="pt-4">
                <Button variant="outline" asChild className="w-full">
                  <RouterLink to={`/games?id=${selectedLink.gameId}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Edit Game Settings
                  </RouterLink>
                </Button>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setSelectedLink(null)}>
              Close
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Unlink
            </Button>
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
