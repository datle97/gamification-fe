import {
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  UnsavedChangesSheet,
  UnsavedChangesSheetContent,
} from '@/components/common/unsaved-changes-sheet'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useRotateApiKey,
  useUpdateApiKey,
} from '@/hooks/queries/useApiKeys'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { createColumnHelper } from '@/lib/column-helper'
import type { ApiKey } from '@/schemas/apiKey.schema'
import { AlertTriangle, Check, Copy, Key, Loader2, Plus, Power, PowerOff, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const columnHelper = createColumnHelper<ApiKey>()

interface FormData {
  keyId: string
  name: string
}

const initialFormData: FormData = {
  keyId: '',
  name: '',
}

type SheetMode = 'create' | 'edit'

interface AppApiKeysTabProps {
  appId: string
}

export function AppApiKeysTab({ appId }: AppApiKeysTabProps) {
  const { data: allKeys = [], isLoading } = useApiKeys()
  const createKey = useCreateApiKey()
  const updateKey = useUpdateApiKey()
  const deleteKey = useDeleteApiKey()
  const rotateKey = useRotateApiKey()

  const keys = useMemo(
    () => allKeys.filter((k) => k.appId === appId),
    [allKeys, appId]
  )

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>('create')
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [sheetInitialData, setSheetInitialData] = useState<FormData>(initialFormData)

  // API Key modal state
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
  const [displayedApiKey, setDisplayedApiKey] = useState('')
  const [apiKeyCopied, setApiKeyCopied] = useState(false)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null)

  // Rotate key confirmation state
  const [rotateConfirmOpen, setRotateConfirmOpen] = useState(false)
  const [keyToRotate, setKeyToRotate] = useState<ApiKey | null>(null)

  const { isDirty } = useUnsavedChanges({
    data: formData,
    initialData: sheetOpen ? sheetInitialData : undefined,
  })

  const handleUpdate = useCallback(
    async (row: ApiKey, field: keyof ApiKey, value: string | number | boolean | null) => {
      await updateKey.mutateAsync({
        id: row.keyId,
        data: { [field]: value },
      })
    },
    [updateKey]
  )

  const handleOpenEdit = useCallback((key: ApiKey) => {
    const editFormData: FormData = {
      keyId: key.keyId,
      name: key.name ?? '',
    }
    setFormData(editFormData)
    setSheetInitialData(editFormData)
    setSheetMode('edit')
    setSheetOpen(true)
  }, [])

  const handleOpenDelete = useCallback((key: ApiKey) => {
    setKeyToDelete(key)
    setDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (!keyToDelete) return
    await deleteKey.mutateAsync(keyToDelete.keyId)
    setDeleteConfirmOpen(false)
    setKeyToDelete(null)
  }

  const handleOpenRotate = useCallback((key: ApiKey) => {
    setKeyToRotate(key)
    setRotateConfirmOpen(true)
  }, [])

  const handleConfirmRotate = async () => {
    if (!keyToRotate) return
    const result = await rotateKey.mutateAsync(keyToRotate.keyId)
    setRotateConfirmOpen(false)
    setKeyToRotate(null)
    setDisplayedApiKey(result.apiKey)
    setApiKeyModalOpen(true)
  }

  const columns = useMemo(
    () => [
      columnHelper.stacked('key', 'API Key', {
        primary: (row) => row.name || row.apiKeyPrefix || row.keyId,
        secondary: (row) => row.apiKeyPrefix ? `${row.apiKeyPrefix}...` : row.keyId,
        onClick: handleOpenEdit,
      }),
      columnHelper.date('createdAt', 'Created'),
      columnHelper.status('isActive', 'Status'),
      columnHelper.actions(({ row }) => [
        {
          label: row.original.isActive ? 'Deactivate' : 'Activate',
          icon: row.original.isActive ? PowerOff : Power,
          onClick: () => handleUpdate(row.original, 'isActive', !row.original.isActive),
        },
        {
          label: 'Rotate Key',
          icon: RefreshCw,
          onClick: () => handleOpenRotate(row.original),
        },
        {
          label: 'Delete',
          icon: Trash2,
          onClick: () => handleOpenDelete(row.original),
          variant: 'destructive',
        },
      ]),
    ],
    [handleUpdate, handleOpenEdit, handleOpenDelete, handleOpenRotate]
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

  const handleSave = async () => {
    if (sheetMode === 'create') {
      const result = await createKey.mutateAsync({
        appId,
        name: formData.name || undefined,
      })

      handleClose()
      setDisplayedApiKey(result.apiKey)
      setApiKeyModalOpen(true)
    } else {
      await updateKey.mutateAsync({
        id: formData.keyId,
        data: {
          name: formData.name || undefined,
        },
      })
      handleClose()
    }
  }

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(displayedApiKey)
    setApiKeyCopied(true)
    setTimeout(() => setApiKeyCopied(false), 2000)
  }

  const handleCloseApiKeyModal = () => {
    setApiKeyModalOpen(false)
    setDisplayedApiKey('')
    setApiKeyCopied(false)
  }

  const isEditing = sheetMode === 'edit'
  const isSaving = createKey.isPending || updateKey.isPending

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys for this app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId={`api-keys-${appId}`}
            columns={columns}
            data={keys}
            loading={isLoading}
            emptyMessage="No API keys yet. Create your first key."
            enableSorting
            enableSearch
            searchPlaceholder="Search keys..."
            actions={[
              {
                label: 'New Key',
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
            <SheetTitle>{isEditing ? 'Edit API Key' : 'Create API Key'}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? 'Update key configuration'
                : 'Create a new API key for this app'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-auto px-4">
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="keyId">Key ID</Label>
                <Input
                  id="keyId"
                  value={formData.keyId}
                  className="font-mono"
                  disabled
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Partner Mobile App"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Key'}
            </Button>
          </SheetFooter>
        </UnsavedChangesSheetContent>
      </UnsavedChangesSheet>

      {/* API Key Modal */}
      <Dialog open={apiKeyModalOpen} onOpenChange={handleCloseApiKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Save this key securely. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={displayedApiKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyApiKey}
                className="shrink-0"
              >
                {apiKeyCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Important</p>
                  <p className="text-amber-700 dark:text-amber-300">
                    This is the only time you'll see this key. Copy it now and store it securely.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseApiKeyModal}>I've saved the key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{keyToDelete?.name ? <> <strong>{keyToDelete.name}</strong></> : ' this key'}? This action
              cannot be undone and will immediately invalidate the key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteKey.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rotate Key Confirmation */}
      <AlertDialog open={rotateConfirmOpen} onOpenChange={setRotateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rotate the API key{keyToRotate?.name ? <> for <strong>{keyToRotate.name}</strong></> : ''}?
              The current key will be immediately invalidated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRotate}>
              {rotateKey.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Rotate Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
