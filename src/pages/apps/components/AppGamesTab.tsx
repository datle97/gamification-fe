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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateLink, useDeleteLink, useGames, useLinks } from '@/hooks/queries'
import { createColumnHelper } from '@/lib/column-helper'
import { gameStatusLabels, gameStatusVariants, type GameStatus } from '@/schemas/game.schema'
import type { Link } from '@/schemas/link.schema'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const columnHelper = createColumnHelper<Link>()

interface AppGamesTabProps {
  appId: string
}

export function AppGamesTab({ appId }: AppGamesTabProps) {
  const { data: links = [], isLoading } = useLinks({ appId })
  const { data: games = [], isLoading: gamesLoading } = useGames()
  const createLink = useCreateLink()
  const deleteLink = useDeleteLink()

  const [selectedLink, setSelectedLink] = useState<Link | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const linkedGameIds = useMemo(() => new Set(links.map((link) => link.gameId)), [links])
  const availableGames = useMemo(
    () => games.filter((game) => !linkedGameIds.has(game.gameId)),
    [games, linkedGameIds]
  )

  const handleOpenDelete = useCallback((link: Link) => {
    setSelectedLink(link)
    setShowDeleteDialog(true)
  }, [])

  const columns = useMemo(
    () => [
      columnHelper.stacked('game', 'Game', {
        primary: (row) => row.game?.name,
        secondary: (row) => row.game?.code,
      }),
      columnHelper.custom('status', 'Status', ({ row }) => {
        const status = row.original.game?.status as GameStatus | undefined
        if (!status) {
          return <span className="text-sm text-muted-foreground">Unknown</span>
        }
        return <Badge variant={gameStatusVariants[status]}>{gameStatusLabels[status]}</Badge>
      }),
      columnHelper.date('createdAt', 'Linked At'),
      columnHelper.actions(({ row }) => [
        {
          label: 'Unlink',
          icon: Trash2,
          onClick: () => handleOpenDelete(row.original),
          variant: 'destructive',
        },
      ]),
    ],
    [handleOpenDelete]
  )

  const handleDelete = async () => {
    if (!selectedLink) return
    await deleteLink.mutateAsync({ appId: selectedLink.appId, gameId: selectedLink.gameId })
    setShowDeleteDialog(false)
    setSelectedLink(null)
  }

  const handleOpenLinkDialog = () => {
    setSelectedGameId('')
    setLinkDialogOpen(true)
  }

  const handleLinkGame = async () => {
    if (!selectedGameId) return
    await createLink.mutateAsync({ appId, gameId: selectedGameId })
    setLinkDialogOpen(false)
    setSelectedGameId('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Games</CardTitle>
        <CardDescription>Manage games linked to this app</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          tableId={`app-games-${appId}`}
          columns={columns}
          data={links}
          loading={isLoading}
          emptyMessage="No games linked yet. Link a game to get started."
          enableSorting
          enableSearch
          searchPlaceholder="Search games..."
          actions={[
            {
              label: 'Link Game',
              icon: Plus,
              onClick: handleOpenLinkDialog,
              variant: 'default',
              disabled: availableGames.length === 0,
            },
          ]}
        />

        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Game</DialogTitle>
              <DialogDescription>Select a game to link to this app.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>
                Game <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedGameId}
                onValueChange={setSelectedGameId}
                disabled={gamesLoading || createLink.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent>
                  {availableGames.map((game) => (
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleLinkGame}
                disabled={!selectedGameId || createLink.isPending}
              >
                {createLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Link Game
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlink Game?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the link to "{selectedLink?.game?.name}". The game itself will not
                be deleted.
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
      </CardContent>
    </Card>
  )
}
