import {
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  UnsavedChangesSheet,
  UnsavedChangesSheetContent,
} from '@/components/common/unsaved-changes-sheet'
import { TimezoneSelect } from '@/components/common/TimezoneSelect'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreatePortal,
  useDeletePortal,
  usePortals,
  useUpdatePortal,
} from '@/hooks/queries/usePortals'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { createColumnHelper } from '@/lib/column-helper'
import type { Portal } from '@/schemas/portal.schema'
import { Loader2, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const columnHelper = createColumnHelper<Portal>()

interface FormData {
  portalId: number | ''
  name: string
  timezone: string
  config: string
  metadata: string
}

const initialFormData: FormData = {
  portalId: '',
  name: '',
  timezone: 'Asia/Ho_Chi_Minh',
  config: '{}',
  metadata: '{}',
}

type SheetMode = 'create' | 'edit'

export function PortalsPage() {
  const { data: portals = [], isLoading, error } = usePortals()
  const createPortal = useCreatePortal()
  const updatePortal = useUpdatePortal()
  const deletePortal = useDeletePortal()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>('create')
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [sheetInitialData, setSheetInitialData] = useState<FormData>(initialFormData)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [portalToDelete, setPortalToDelete] = useState<Portal | null>(null)

  const { isDirty } = useUnsavedChanges({
    data: formData,
    initialData: sheetOpen ? sheetInitialData : undefined,
  })

  const handleUpdate = useCallback(
    async (row: Portal, field: keyof Portal, value: string | number | boolean | null) => {
      await updatePortal.mutateAsync({
        id: row.portalId,
        data: { [field]: value },
      })
    },
    [updatePortal]
  )

  const handleOpenEdit = useCallback((portal: Portal) => {
    const editFormData: FormData = {
      portalId: portal.portalId,
      name: portal.name,
      timezone: portal.timezone || 'Asia/Ho_Chi_Minh',
      config: JSON.stringify(portal.config ?? {}, null, 2),
      metadata: JSON.stringify(portal.metadata ?? {}, null, 2),
    }
    setFormData(editFormData)
    setSheetInitialData(editFormData)
    setSheetMode('edit')
    setSheetOpen(true)
  }, [])

  const handleOpenDelete = useCallback((portal: Portal) => {
    setPortalToDelete(portal)
    setDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (!portalToDelete) return
    await deletePortal.mutateAsync(portalToDelete.portalId)
    setDeleteConfirmOpen(false)
    setPortalToDelete(null)
  }

  const columns = useMemo(
    () => [
      columnHelper.stacked('portal', 'Portal', {
        primary: (row) => row.name,
        secondary: (row) => `ID: ${row.portalId}`,
        onClick: handleOpenEdit,
      }),
      columnHelper.custom('timezone', 'Timezone', ({ row }) => (
        <span className="text-muted-foreground">{row.original.timezone}</span>
      )),
      columnHelper.date('createdAt', 'Created'),
      columnHelper.status('isActive', 'Status'),
      columnHelper.actions(({ row }) => [
        {
          label: row.original.isActive ? 'Deactivate' : 'Activate',
          icon: row.original.isActive ? PowerOff : Power,
          onClick: () => handleUpdate(row.original, 'isActive', !row.original.isActive),
        },
        {
          label: 'Delete',
          icon: Trash2,
          onClick: () => handleOpenDelete(row.original),
          variant: 'destructive',
        },
      ]),
    ],
    [handleUpdate, handleOpenEdit, handleOpenDelete]
  )

  const handleOpenCreate = () => {
    setFormData(initialFormData)
    setSheetInitialData(initialFormData)
    setSheetMode('create')
    setSheetOpen(true)
  }

  const handleClose = () => {
    setSheetOpen(false)
    setFormData(initialFormData)
  }

  const parseJson = (value: string) => {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.portalId) return

    if (sheetMode === 'create') {
      await createPortal.mutateAsync({
        portalId: Number(formData.portalId),
        name: formData.name,
        timezone: formData.timezone,
        config: parseJson(formData.config),
        metadata: parseJson(formData.metadata),
      })
      handleClose()
    } else {
      await updatePortal.mutateAsync({
        id: Number(formData.portalId),
        data: {
          name: formData.name,
          timezone: formData.timezone,
          config: parseJson(formData.config),
          metadata: parseJson(formData.metadata),
        },
      })
      handleClose()
    }
  }

  const isEditing = sheetMode === 'edit'
  const isSaving = createPortal.isPending || updatePortal.isPending

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">
          Failed to load portals: {error.message}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Portals</CardTitle>
          <CardDescription>Manage gamification portals and their configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId="portals-list"
            columns={columns}
            data={portals}
            loading={isLoading}
            emptyMessage="No portals yet. Create your first portal."
            enableSorting
            enableSearch
            searchPlaceholder="Search portals..."
            actions={[
              {
                label: 'New Portal',
                icon: Plus,
                onClick: handleOpenCreate,
                variant: 'default',
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <UnsavedChangesSheet
        open={sheetOpen}
        onOpenChange={(open) => !open && handleClose()}
        isDirty={isDirty}
      >
        <UnsavedChangesSheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit Portal' : 'Create Portal'}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? 'Update portal configuration'
                : 'Create a new gamification portal'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-auto px-4">
            <div className="space-y-2">
              <Label htmlFor="portalId">
                Portal ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="portalId"
                type="number"
                placeholder="e.g., 12345"
                value={formData.portalId}
                onChange={(e) =>
                  setFormData({ ...formData, portalId: e.target.value ? parseInt(e.target.value) : '' })
                }
                disabled={isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="My Portal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <TimezoneSelect
                value={formData.timezone}
                onChange={(timezone) => setFormData({ ...formData, timezone })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="config">Config (JSON)</Label>
              <Textarea
                id="config"
                placeholder="{}"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                className="font-mono text-sm min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata (JSON)</Label>
              <Textarea
                id="metadata"
                placeholder="{}"
                value={formData.metadata}
                onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                className="font-mono text-sm min-h-20"
              />
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={!formData.name || !formData.portalId || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Portal'}
            </Button>
          </SheetFooter>
        </UnsavedChangesSheetContent>
      </UnsavedChangesSheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{portalToDelete?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePortal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
