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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import {
  useCreateMission,
  useDeleteMission,
  useMissionsByGame,
  useUpdateMission,
} from '@/hooks/queries'
import { createColumnHelper } from '@/lib/column-helper'
import {
  missionTypeLabels,
  triggerEventLabels,
  type CreateMissionInput,
  type Mission,
} from '@/schemas/mission.schema'
import { Copy, Loader2, Plus, Power, PowerOff, SquarePen, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  MissionFormDialog,
  missionToFormData,
  type MissionFormData,
} from './MissionFormDialog'

const columnHelper = createColumnHelper<Mission>()

type DialogMode = 'closed' | 'create' | 'edit'

interface GameMissionsTabProps {
  gameId: string
}

export function GameMissionsTab({ gameId }: GameMissionsTabProps) {
  const { data: missions = [], isLoading } = useMissionsByGame(gameId)
  const createMission = useCreateMission()
  const updateMission = useUpdateMission()
  const deleteMission = useDeleteMission()

  const [dialogMode, setDialogMode] = useState<DialogMode>('closed')
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [dialogInitialData, setDialogInitialData] = useState<MissionFormData | undefined>()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleInlineUpdate = useCallback(
    async (mission: Mission, field: string, value: unknown) => {
      await updateMission.mutateAsync({
        gameId,
        id: mission.missionId,
        data: { [field]: value },
      })
    },
    [gameId, updateMission]
  )

  const handleDuplicate = useCallback((mission: Mission) => {
    const duplicateFormData: MissionFormData = {
      ...missionToFormData(mission),
      code: '',
      name: `Copy of ${mission.name}`,
      isActive: false,
    }
    setDialogMode('create')
    setSelectedMission(null)
    setDialogInitialData(duplicateFormData)
  }, [])

  const handleDeleteFromMenu = useCallback((mission: Mission) => {
    setSelectedMission(mission)
    setShowDeleteDialog(true)
  }, [])

  const handleRowClick = useCallback((mission: Mission) => {
    setDialogMode('edit')
    setSelectedMission(mission)
    setDialogInitialData(undefined)
  }, [])

  const columns = [
    columnHelper.text('name', 'Name', { variant: 'primary' }),
    columnHelper.badge('triggerEvent', 'Trigger', {
      labels: triggerEventLabels,
    }),
    columnHelper.badge('missionType', 'Type', {
      labels: missionTypeLabels,
    }),
    columnHelper.text('rewardValue', 'Reward', {
      render: (row) => `${row.rewardValue} ${row.rewardType}`,
    }),
    columnHelper.status('isActive', 'Status'),
    columnHelper.actions(({ row }) => {
      const mission = row.original
      return [
        { label: 'Edit', icon: SquarePen, onClick: () => handleRowClick(mission) },
        { label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(mission) },
        'separator',
        {
          label: mission.isActive ? 'Deactivate' : 'Activate',
          icon: mission.isActive ? PowerOff : Power,
          onClick: () => handleInlineUpdate(mission, 'isActive', !mission.isActive),
        },
        'separator',
        { label: 'Delete', icon: Trash2, onClick: () => handleDeleteFromMenu(mission), variant: 'destructive' },
      ]
    }),
  ]

  const handleOpenCreate = () => {
    setDialogMode('create')
    setSelectedMission(null)
    setDialogInitialData(undefined)
  }

  const handleClose = () => {
    setDialogMode('closed')
    setSelectedMission(null)
    setDialogInitialData(undefined)
  }

  const parseJsonField = (value: string) => {
    if (!value.trim()) return undefined
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }

  const handleSave = async (formData: MissionFormData) => {
    const conditions = parseJsonField(formData.conditions)

    if (dialogMode === 'create') {
      await createMission.mutateAsync({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        triggerEvent: formData.triggerEvent,
        missionType: formData.missionType,
        missionPeriod: formData.missionPeriod,
        targetValue: formData.targetValue,
        maxCompletions: formData.maxCompletions || undefined,
        rewardType: formData.rewardType,
        rewardValue: formData.rewardValue,
        displayOrder: formData.displayOrder,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        isActive: formData.isActive,
        allowFeTrigger: formData.allowFeTrigger,
        conditions,
        rewardExpirationConfig: formData.rewardExpirationConfig,
        gameId,
      } as CreateMissionInput)
    } else if (dialogMode === 'edit' && selectedMission) {
      await updateMission.mutateAsync({
        gameId,
        id: selectedMission.missionId,
        data: {
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl,
          triggerEvent: formData.triggerEvent,
          missionType: formData.missionType,
          missionPeriod: formData.missionPeriod,
          targetValue: formData.targetValue,
          maxCompletions: formData.maxCompletions,
          rewardType: formData.rewardType,
          rewardValue: formData.rewardValue,
          displayOrder: formData.displayOrder,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
          allowFeTrigger: formData.allowFeTrigger,
          conditions,
          rewardExpirationConfig: formData.rewardExpirationConfig,
        },
      })
    }

    handleClose()
  }

  const handleDelete = async () => {
    if (!selectedMission) return
    await deleteMission.mutateAsync({ gameId, id: selectedMission.missionId })
    setShowDeleteDialog(false)
    handleClose()
  }

  const isPending = createMission.isPending || updateMission.isPending || deleteMission.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missions</CardTitle>
        <CardDescription>Manage missions for this game</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          tableId={`game-missions-${gameId}`}
          columns={columns}
          data={missions}
          loading={isLoading}
          emptyMessage="No missions yet. Create your first mission for this game."
          onRowClick={handleRowClick}
          enableSorting
          enableColumnVisibility
          actions={[
            {
              label: 'New Mission',
              icon: Plus,
              onClick: handleOpenCreate,
              variant: 'default',
            },
          ]}
          enableSearch
          searchPlaceholder="Search missions..."
        />
      </CardContent>

      <MissionFormDialog
        open={dialogMode !== 'closed'}
        onOpenChange={(open) => !open && handleClose()}
        mode={dialogMode === 'edit' ? 'edit' : 'create'}
        mission={selectedMission}
        initialData={dialogInitialData}
        onSave={handleSave}
        isPending={isPending}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mission "{selectedMission?.name}". This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMission.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
