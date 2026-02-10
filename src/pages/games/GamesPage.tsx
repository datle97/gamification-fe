import { RichTextEditor } from '@/components/common/lazy-rich-text-editor'
import {
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  UnsavedChangesSheet,
  UnsavedChangesSheetContent,
} from '@/components/common/unsaved-changes-sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useCloneGame,
  useCreateGame,
  useDeleteGame,
  useExportGame,
  useGames,
  useImportGame,
  usePreviewImport,
} from '@/hooks/queries'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { createColumnHelper } from '@/lib/column-helper'
import { downloadGameExport, type GameExport } from '@/lib/game-export'
import {
  cloneGameSchema,
  gameStatusLabels,
  gameStatusVariants,
  gameTypeLabels,
  type CloneGameInput,
  type CreateGameInput,
  type Game,
  type GameStatus,
  type GameType,
} from '@/schemas/game.schema'
import type { PreviewImportResult } from '@/services/games.service'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { AlertCircle, CheckCircle2, Copy, Download, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

const columnHelper = createColumnHelper<Game>()

const gameTypes: GameType[] = ['spin', 'scratch', 'quiz', 'puzzle', 'match', 'lottery']
const gameStatuses: GameStatus[] = ['draft', 'active', 'paused', 'ended']

interface FormData {
  code: string
  name: string
  type?: GameType
  description: string
  iconUrl: string
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
  iconUrl: '',
  templateUrl: '',
  status: 'draft',
  startAt: null,
  endAt: null,
  timezone: 'Asia/Ho_Chi_Minh',
}

// Helper component for action badges
function ActionBadge({
  action,
  size = 'default',
}: {
  action: 'create' | 'update' | 'skip'
  size?: 'default' | 'sm'
}) {
  const sizeClass = size === 'sm' ? 'px-1 py-0.5 text-[10px]' : 'px-1.5 py-0.5 text-xs'

  if (action === 'create') {
    return (
      <span className={`${sizeClass} rounded bg-primary/10 text-primary font-medium`}>NEW</span>
    )
  }
  if (action === 'update') {
    return (
      <span className={`${sizeClass} rounded bg-amber-500/10 text-amber-600 font-medium`}>
        UPDATE
      </span>
    )
  }
  // skip = unchanged
  return (
    <span className={`${sizeClass} rounded bg-muted text-muted-foreground font-medium`}>
      UNCHANGED
    </span>
  )
}

export function GamesPage() {
  const navigate = useNavigate()
  const { data: games = [], isLoading, error } = useGames()
  const createGame = useCreateGame()
  const deleteGame = useDeleteGame()
  const cloneGame = useCloneGame()
  const exportGame = useExportGame()
  const importGame = useImportGame()
  const previewImport = usePreviewImport()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [sheetInitialData, setSheetInitialData] = useState<FormData>(initialFormData)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null)

  // Clone dialog state
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
  const [cloneSourceId, setCloneSourceId] = useState('')
  const cloneForm = useForm<CloneGameInput>({
    resolver: zodResolver(cloneGameSchema),
    defaultValues: {
      newCode: '',
      newName: '',
      includeMissions: true,
      includeRewards: true,
    },
  })

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importData, setImportData] = useState<GameExport | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importPreview, setImportPreview] = useState<PreviewImportResult | null>(null)
  const [importInclude, setImportInclude] = useState({
    game: true,
    missions: true,
    rewards: true,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track unsaved changes for create sheet
  const { isDirty: isCreateDirty } = useUnsavedChanges({
    data: formData,
    initialData: sheetOpen ? sheetInitialData : undefined,
  })

  // Track unsaved changes for import sheet (dirty if file is selected)
  const isImportDirty = importData !== null

  const handleOpenDelete = useCallback((game: Game) => {
    setGameToDelete(game)
    setDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (!gameToDelete) return
    await deleteGame.mutateAsync(gameToDelete.gameId)
    setDeleteConfirmOpen(false)
    setGameToDelete(null)
  }

  const handleExport = useCallback(
    async (game: Game) => {
      const data = await exportGame.mutateAsync(game.gameId)
      downloadGameExport(data)
      toast.success(`Exported "${game.name}"`)
    },
    [exportGame]
  )

  const handleOpenClone = useCallback((game: Game) => {
    setCloneSourceId(game.gameId)
    cloneForm.reset({
      newCode: `${game.code}-copy`,
      newName: `${game.name} (Copy)`,
      includeMissions: true,
      includeRewards: true,
    })
    setCloneDialogOpen(true)
  }, [cloneForm])

  const handleClone = async (data: CloneGameInput) => {
    if (!cloneSourceId) return
    const newGame = await cloneGame.mutateAsync({ id: cloneSourceId, data })
    setCloneDialogOpen(false)
    setCloneSourceId('')
    cloneForm.reset()
    navigate(`/games/${newGame.gameId}`)
  }

  const columns = useMemo(
    () => [
      columnHelper.stacked('game', 'Game', {
        primary: (row) => row.name,
        secondary: (row) => row.code,
        href: (row) => `/games/${row.gameId}`,
      }),
      columnHelper.badge('type', 'Type', { labels: gameTypeLabels }),
      columnHelper.dateRange('startAt', 'endAt', 'Schedule'),
      columnHelper.badge('status', 'Status', {
        labels: gameStatusLabels,
        variants: gameStatusVariants,
      }),
      columnHelper.actions(({ row }) => [
        {
          label: 'Clone',
          icon: Copy,
          onClick: () => handleOpenClone(row.original),
        },
        {
          label: 'Export',
          icon: Download,
          onClick: () => handleExport(row.original),
        },
        {
          label: 'Delete',
          icon: Trash2,
          onClick: () => handleOpenDelete(row.original),
          variant: 'destructive',
        },
      ]),
    ],
    [handleOpenDelete, handleExport, handleOpenClone]
  )

  // Import handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      setImportPreview(null)

      try {
        const json = JSON.parse(event.target?.result as string) as GameExport
        if (!json.version || !json.game || !json.missions || !json.rewards) {
          setImportError('Invalid game export format')
          setImportData(null)
          setImportPreview(null)
          return
        }
        setImportData(json)
        setImportError(null)

        // Fetch preview (dry run)
        try {
          const preview = await previewImport.mutateAsync(json)
          setImportPreview(preview)
        } catch (err) {
          setImportError(`Preview failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      } catch {
        setImportError('Failed to parse JSON file')
        setImportData(null)
        setImportPreview(null)
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!importData) return
    try {
      const result = await importGame.mutateAsync({
        data: importData,
        options: { include: importInclude },
      })
      const action = result.game.action === 'created' ? 'Created' : 'Updated'
      toast.success(
        `${action} game "${importData.game.name}" with ${result.missions.created + result.missions.updated} missions and ${result.rewards.created + result.rewards.updated} rewards`
      )
      setImportDialogOpen(false)
      setImportData(null)
      setImportError(null)
      setImportPreview(null)
      setImportInclude({ game: true, missions: true, rewards: true })
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleCloseImport = () => {
    setImportDialogOpen(false)
    setImportData(null)
    setImportError(null)
    setImportPreview(null)
    setImportInclude({ game: true, missions: true, rewards: true })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenCreate = () => {
    setFormData(initialFormData)
    setSheetInitialData(initialFormData)
    setSheetOpen(true)
  }

  const handleClose = () => {
    setSheetOpen(false)
    setFormData(initialFormData)
  }

  const handleSave = async () => {
    if (!formData.code || !formData.name) return
    const createdGame = await createGame.mutateAsync(formData as CreateGameInput)
    handleClose()
    navigate(`/games/${createdGame.gameId}`)
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
          <CardTitle>Games</CardTitle>
          <CardDescription>Manage game templates with status and schedule settings</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId="games-list"
            columns={columns}
            data={games}
            loading={isLoading}
            emptyMessage="No games yet. Create your first game template."
            enableSorting
            enableSearch
            searchPlaceholder="Search games..."
            actions={[
              {
                label: 'Import',
                icon: Upload,
                onClick: () => setImportDialogOpen(true),
                variant: 'outline',
              },
              {
                label: 'New Game',
                icon: Plus,
                onClick: handleOpenCreate,
                variant: 'default',
              },
            ]}
          />
        </CardContent>
      </Card>

      <UnsavedChangesSheet
        open={sheetOpen}
        onOpenChange={(open) => !open && handleClose()}
        isDirty={isCreateDirty}
      >
        <UnsavedChangesSheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Create Game</SheetTitle>
            <SheetDescription>
              Create a new game template with status and schedule settings
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-auto px-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="e.g., golden-horse"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (lowercase, hyphens only)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
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
                      <SelectItem key={type} value={type}>
                        {gameTypeLabels[type]}
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
                      <SelectItem key={status} value={status}>
                        {gameStatusLabels[status]}
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
              <Label htmlFor="iconUrl">Icon URL</Label>
              <Input
                id="iconUrl"
                placeholder="https://..."
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateUrl">Template URL</Label>
              <Input
                id="templateUrl"
                placeholder="https://..."
                value={formData.templateUrl}
                onChange={(e) => setFormData({ ...formData, templateUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                placeholder="Game description..."
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
              />
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button
              onClick={handleSave}
              disabled={!formData.code || !formData.name || createGame.isPending}
            >
              {createGame.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Game
            </Button>
          </SheetFooter>
        </UnsavedChangesSheetContent>
      </UnsavedChangesSheet>

      {/* Import Dialog */}
      <UnsavedChangesSheet
        open={importDialogOpen}
        onOpenChange={(open) => !open && handleCloseImport()}
        isDirty={isImportDirty}
      >
        <UnsavedChangesSheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Import Game</SheetTitle>
            <SheetDescription>
              Import a game configuration from a JSON file exported from another environment
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-auto px-4">
            <div className="space-y-2">
              <Label htmlFor="importFile">Select JSON File</Label>
              <Input
                ref={fileInputRef}
                id="importFile"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={previewImport.isPending}
              />
            </div>

            {previewImport.isPending && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading preview...
              </div>
            )}

            {importError && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {importError}
              </div>
            )}

            {importData && importPreview && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 text-primary text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Valid game export file
                </div>

                {/* Game Section */}
                <div className="space-y-2 p-4 rounded-md border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="include-game"
                      checked={importInclude.game}
                      onCheckedChange={(checked) =>
                        setImportInclude((prev) => ({ ...prev, game: !!checked }))
                      }
                    />
                    <label htmlFor="include-game" className="flex-1 font-medium cursor-pointer">
                      Game Info
                    </label>
                    <ActionBadge action={importPreview.game.action} />
                  </div>
                  <div className="ml-7 text-sm">
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span className="font-medium">{importData.game.name}</span>
                    <span className="text-muted-foreground ml-3">Code:</span>{' '}
                    <span className="font-mono text-xs">{importData.game.code}</span>
                  </div>
                  {importPreview.game.changes && importPreview.game.changes.length > 0 && (
                    <div className="ml-7 mt-2 text-xs space-y-1">
                      {importPreview.game.changes.slice(0, 3).map((change) => (
                        <div key={change.field} className="text-muted-foreground">
                          <span className="font-medium">{change.field}:</span>{' '}
                          <span className="line-through">{String(change.oldValue ?? '—')}</span>
                          <span className="mx-1">→</span>
                          <span className="text-foreground">{String(change.newValue ?? '—')}</span>
                        </div>
                      ))}
                      {importPreview.game.changes.length > 3 && (
                        <div className="text-muted-foreground">
                          +{importPreview.game.changes.length - 3} more changes
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Missions Section */}
                <div className="space-y-2 p-4 rounded-md border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="include-missions"
                      checked={importInclude.missions}
                      onCheckedChange={(checked) =>
                        setImportInclude((prev) => ({ ...prev, missions: !!checked }))
                      }
                    />
                    <label htmlFor="include-missions" className="flex-1 font-medium cursor-pointer">
                      Missions ({importData.missions.length})
                    </label>
                    <div className="flex gap-1 text-xs">
                      {importPreview.summary.missions.create > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {importPreview.summary.missions.create} new
                        </span>
                      )}
                      {importPreview.summary.missions.update > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                          {importPreview.summary.missions.update} update
                        </span>
                      )}
                      {importPreview.summary.missions.skip > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {importPreview.summary.missions.skip} unchanged
                        </span>
                      )}
                    </div>
                  </div>
                  {importPreview.missions.length > 0 && (
                    <div className="ml-7 mt-2 space-y-1 max-h-32 overflow-auto">
                      {importPreview.missions.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs">
                          <ActionBadge action={m.action} size="sm" />
                          <span className="font-mono text-muted-foreground">{m.code}</span>
                          <span>{m.name}</span>
                          {m.changes && m.changes.length > 0 && (
                            <span className="text-muted-foreground">
                              ({m.changes.length} field{m.changes.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rewards Section */}
                <div className="space-y-2 p-4 rounded-md border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="include-rewards"
                      checked={importInclude.rewards}
                      onCheckedChange={(checked) =>
                        setImportInclude((prev) => ({ ...prev, rewards: !!checked }))
                      }
                    />
                    <label htmlFor="include-rewards" className="flex-1 font-medium cursor-pointer">
                      Rewards ({importData.rewards.length})
                    </label>
                    <div className="flex gap-1 text-xs">
                      {importPreview.summary.rewards.create > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {importPreview.summary.rewards.create} new
                        </span>
                      )}
                      {importPreview.summary.rewards.update > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                          {importPreview.summary.rewards.update} update
                        </span>
                      )}
                      {importPreview.summary.rewards.skip > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {importPreview.summary.rewards.skip} unchanged
                        </span>
                      )}
                    </div>
                  </div>
                  {importPreview.rewards.length > 0 && (
                    <div className="ml-7 mt-2 space-y-1 max-h-48 overflow-auto">
                      {importPreview.rewards.map((r) => (
                        <div key={r.id} className="flex items-center gap-2 text-xs">
                          <ActionBadge action={r.action} size="sm" />
                          <span>{r.name}</span>
                          {r.changes && r.changes.length > 0 && (
                            <span className="text-muted-foreground">
                              ({r.changes.length} field{r.changes.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Exported: {dayjs(importData.exportedAt).format('YYYY-MM-DD HH:mm:ss')}
                </div>
              </div>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button
              onClick={handleImport}
              disabled={
                !importData ||
                !importPreview ||
                importGame.isPending ||
                (!importInclude.game && !importInclude.missions && !importInclude.rewards)
              }
            >
              {importGame.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import Selected
            </Button>
          </SheetFooter>
        </UnsavedChangesSheetContent>
      </UnsavedChangesSheet>

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Game</DialogTitle>
            <DialogDescription>
              Create a copy of this game with a new code and name.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={cloneForm.handleSubmit(handleClone)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newCode">New Code</Label>
              <Input
                id="newCode"
                {...cloneForm.register('newCode')}
                placeholder="e.g., my-game-copy"
              />
              {cloneForm.formState.errors.newCode && (
                <p className="text-sm text-destructive">
                  {cloneForm.formState.errors.newCode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newName">New Name</Label>
              <Input
                id="newName"
                {...cloneForm.register('newName')}
                placeholder="e.g., My Game (Copy)"
              />
              {cloneForm.formState.errors.newName && (
                <p className="text-sm text-destructive">
                  {cloneForm.formState.errors.newName.message}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Label>Include</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMissions"
                  checked={cloneForm.watch('includeMissions')}
                  onCheckedChange={(checked) =>
                    cloneForm.setValue('includeMissions', checked === true)
                  }
                />
                <Label htmlFor="includeMissions" className="font-normal cursor-pointer">
                  Missions
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRewards"
                  checked={cloneForm.watch('includeRewards')}
                  onCheckedChange={(checked) =>
                    cloneForm.setValue('includeRewards', checked === true)
                  }
                />
                <Label htmlFor="includeRewards" className="font-normal cursor-pointer">
                  Rewards (as inactive templates)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCloneDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={cloneGame.isPending}>
                {cloneGame.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Clone Game
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{gameToDelete?.name}</strong>? This action
              cannot be undone and will remove all associated missions and rewards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGame.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
