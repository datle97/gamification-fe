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
import { AppSelect } from '@/components/common/AppSelect'
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
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateSdkClient,
  useDeleteSdkClient,
  useRotateSdkClientApiKey,
  useSdkClients,
  useUpdateSdkClient,
} from '@/hooks/queries/useSdkClients'
import { useApps } from '@/hooks/queries'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { createColumnHelper } from '@/lib/column-helper'
import type { CreateSdkClientInput, SdkClient } from '@/schemas/sdkClient.schema'
import { AlertTriangle, Check, Copy, Key, Loader2, Plus, Power, PowerOff, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const columnHelper = createColumnHelper<SdkClient>()

interface FormData {
  clientId: string
  name: string
  appId: string
  description: string
  metadata: string
}

const initialFormData: FormData = {
  clientId: '',
  name: '',
  appId: '',
  description: '',
  metadata: '{}',
}

type SheetMode = 'create' | 'edit'

export function SdkClientsPage() {
  const { data: clients = [], isLoading, error } = useSdkClients()
  const { data: apps = [] } = useApps()
  const createClient = useCreateSdkClient()
  const updateClient = useUpdateSdkClient()
  const deleteClient = useDeleteSdkClient()
  const rotateKey = useRotateSdkClientApiKey()

  const appNameMap = useMemo(
    () => new Map(apps.map((a) => [a.appId, a.name])),
    [apps]
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
  const [clientToDelete, setClientToDelete] = useState<SdkClient | null>(null)

  // Rotate key confirmation state
  const [rotateConfirmOpen, setRotateConfirmOpen] = useState(false)
  const [clientToRotate, setClientToRotate] = useState<SdkClient | null>(null)

  const { isDirty } = useUnsavedChanges({
    data: formData,
    initialData: sheetOpen ? sheetInitialData : undefined,
  })

  const handleUpdate = useCallback(
    async (row: SdkClient, field: keyof SdkClient, value: string | number | boolean | null) => {
      await updateClient.mutateAsync({
        id: row.clientId,
        data: { [field]: value },
      })
    },
    [updateClient]
  )

  const handleOpenEdit = useCallback((client: SdkClient) => {
    const editFormData: FormData = {
      clientId: client.clientId,
      name: client.name,
      appId: client.appId,
      description: client.description ?? '',
      metadata: JSON.stringify(client.metadata ?? {}, null, 2),
    }
    setFormData(editFormData)
    setSheetInitialData(editFormData)
    setSheetMode('edit')
    setSheetOpen(true)
  }, [])

  const handleOpenDelete = useCallback((client: SdkClient) => {
    setClientToDelete(client)
    setDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return
    await deleteClient.mutateAsync(clientToDelete.clientId)
    setDeleteConfirmOpen(false)
    setClientToDelete(null)
  }

  const handleOpenRotate = useCallback((client: SdkClient) => {
    setClientToRotate(client)
    setRotateConfirmOpen(true)
  }, [])

  const handleConfirmRotate = async () => {
    if (!clientToRotate) return
    const result = await rotateKey.mutateAsync(clientToRotate.clientId)
    setRotateConfirmOpen(false)
    setClientToRotate(null)
    setDisplayedApiKey(result.apiKey)
    setApiKeyModalOpen(true)
  }

  const columns = useMemo(
    () => [
      columnHelper.stacked('client', 'Client', {
        primary: (row) => row.name,
        secondary: (row) => row.apiKeyPrefix ? `${row.apiKeyPrefix}...` : row.clientId,
        onClick: handleOpenEdit,
      }),
      columnHelper.custom('appId', 'App', ({ row }) => (
        <span className="text-muted-foreground">
          {appNameMap.get(row.original.appId) ?? row.original.appId}
        </span>
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
          label: 'Rotate API Key',
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
    [handleUpdate, handleOpenEdit, handleOpenDelete, handleOpenRotate, appNameMap]
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
    if (!formData.name) return

    let metadata: Record<string, unknown> = {}
    try {
      metadata = JSON.parse(formData.metadata)
    } catch {
      // Invalid JSON, keep empty
    }

    if (sheetMode === 'create') {
      const result = await createClient.mutateAsync({
        name: formData.name,
        appId: formData.appId,
        description: formData.description,
        metadata,
      } as CreateSdkClientInput)

      handleClose()
      setDisplayedApiKey(result.apiKey)
      setApiKeyModalOpen(true)
    } else {
      await updateClient.mutateAsync({
        id: formData.clientId,
        data: {
          name: formData.name,
          description: formData.description,
          metadata,
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
  const isSaving = createClient.isPending || updateClient.isPending

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">
          Failed to load SDK clients: {error.message}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SDK Clients</CardTitle>
          <CardDescription>
            Manage external clients that integrate with your gamification platform via SDK
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId="sdk-clients-list"
            columns={columns}
            data={clients}
            loading={isLoading}
            emptyMessage="No SDK clients yet. Create your first client."
            enableSorting
            enableSearch
            searchPlaceholder="Search clients..."
            actions={[
              {
                label: 'New Client',
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
            <SheetTitle>{isEditing ? 'Edit SDK Client' : 'Create SDK Client'}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? 'Update client configuration'
                : 'Create a new SDK client for external integration'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-auto px-4">
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={formData.clientId}
                  className="font-mono"
                  disabled
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Partner Mobile App"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Integration for partner's mobile application"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-16"
              />
            </div>

            <div className="space-y-2">
              <Label>App</Label>
              <AppSelect
                value={formData.appId}
                onChange={(appId) => setFormData({ ...formData, appId })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata (JSON)</Label>
              <Textarea
                id="metadata"
                placeholder="{}"
                value={formData.metadata}
                onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                className="font-mono text-sm min-h-24"
              />
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={!formData.name || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Client'}
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
            <AlertDialogTitle>Delete SDK Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{clientToDelete?.name}</strong>? This action
              cannot be undone and will invalidate all existing API keys.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
              Are you sure you want to rotate the API key for <strong>{clientToRotate?.name}</strong>
              ? The current key will be immediately invalidated.
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
    </div>
  )
}
