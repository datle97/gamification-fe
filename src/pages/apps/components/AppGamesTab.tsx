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
import { useCreateLink, useDeleteLink, useGames, useLinks } from '@/hooks/queries'
import { createColumnHelper } from '@/lib/column-helper'
import { gameStatusVariants, type GameStatus } from '@/schemas/game.schema'
import type { Link } from '@/schemas/link.schema'
import dayjs from 'dayjs'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

const columnHelper = createColumnHelper<Link>()

type SheetMode = 'closed' | 'create' | 'view'

interface AppGamesTabProps {
  appId: string
}

export function AppGamesTab({ appId }: AppGamesTabProps) {
  const { data: links = [], isLoading } = useLinks({ appId })
  const { data: games = [], isLoading: gamesLoading } = useGames()
  const createLink = useCreateLink()
  const deleteLink = useDeleteLink()

  const columns = useMemo(
    () => [
      columnHelper.stacked('game', 'Game', {
        primary: (row) => row.game?.name,
        secondary: (row) => row.game?.code,
      }),
      columnHelper.date('createdAt', 'Linked At'),
    ],
    []
  )

  const [sheetMode, setSheetMode] = useState<SheetMode>('closed')
  const [selectedLink, setSelectedLink] = useState<Link | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleOpenCreate = () => {
    setSheetMode('create')
    setSelectedLink(null)
    setSelectedGameId('')
  }

  const handleRowClick = (link: Link) => {
    setSheetMode('view')
    setSelectedLink(link)
  }

  const handleClose = () => {
    setSheetMode('closed')
    setSelectedLink(null)
    setSelectedGameId('')
  }

  const handleCreate = async () => {
    if (!selectedGameId) return
    await createLink.mutateAsync({ appId, gameId: selectedGameId })
    handleClose()
  }

  const handleDelete = async () => {
    if (!selectedLink) return
    await deleteLink.mutateAsync({ appId: selectedLink.appId, gameId: selectedLink.gameId })
    setShowDeleteDialog(false)
    handleClose()
  }

  const isCreate = sheetMode === 'create'

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
          onRowClick={handleRowClick}
          enableSorting
          enableSearch
          searchPlaceholder="Search games..."
          actions={[
            {
              label: 'Link Game',
              icon: Plus,
              onClick: handleOpenCreate,
              variant: 'default',
            },
          ]}
        />

        <Sheet open={sheetMode !== 'closed'} onOpenChange={(open) => !open && handleClose()}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{isCreate ? 'Link Game' : 'Link Details'}</SheetTitle>
              <SheetDescription>
                {isCreate ? 'Select a game to link to this app' : 'View link details'}
              </SheetDescription>
            </SheetHeader>

            {isCreate ? (
              <div className="flex-1 space-y-4 overflow-auto px-4">
                <div className="space-y-2">
                  <Label>
                    Game <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedGameId}
                    onValueChange={setSelectedGameId}
                    disabled={gamesLoading}
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
                            variant={gameStatusVariants[selectedLink.game.status as GameStatus]}
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
                            {' - '}
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
                  disabled={!selectedGameId || createLink.isPending}
                >
                  {createLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Link Game
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
