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
import { useApps, useCreateLink, useDeleteLink, useGames, useLinks } from '@/hooks/queries'
import { createColumnHelper } from '@/lib/column-helper'
import { gameStatusVariants, type GameStatus } from '@/schemas/game.schema'
import type { Link } from '@/schemas/link.schema'
import dayjs from 'dayjs'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

const columnHelper = createColumnHelper<Link>()

type SheetMode = 'closed' | 'create' | 'view'

export function AppGamesPage() {
  const { data: links = [], isLoading, error } = useLinks()
  const { data: apps = [], isLoading: appsLoading } = useApps()
  const { data: games = [], isLoading: gamesLoading } = useGames()
  const createLink = useCreateLink()
  const deleteLink = useDeleteLink()

  const columns = useMemo(
    () => [
      columnHelper.stacked('app', 'App', {
        primary: (row) => row.app?.name,
        secondary: (row) => row.appId,
      }),
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
          <CardTitle>App Games</CardTitle>
          <CardDescription>Link games to apps.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={links}
            loading={isLoading}
            emptyMessage="No app-game links yet. Link a game to an app to create a campaign."
            onRowClick={handleRowClick}
            enableSorting
            enableSearch
            actions={[
              {
                label: 'Link Game',
                icon: Plus,
                onClick: handleOpenCreate,
                variant: 'default',
              },
            ]}
            searchPlaceholder="Search links..."
          />
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
                <Label htmlFor="app">
                  App <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="game">
                  Game <span className="text-destructive">*</span>
                </Label>
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
