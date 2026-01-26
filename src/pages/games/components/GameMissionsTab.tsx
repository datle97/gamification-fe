import { ExpirationEditor } from '@/components/common/ExpirationEditor'
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
import { Combobox } from '@/components/ui/combobox'
import { DataTable } from '@/components/ui/data-table'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateMission,
  useDeleteMission,
  useMissionsByGame,
  useUpdateMission,
} from '@/hooks/queries'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { createColumnHelper } from '@/lib/column-helper'
import {
  missionPeriodLabels,
  missionRewardTypeLabels,
  missionTypeLabels,
  predefinedTriggerEvents,
  triggerEventLabels,
  type CreateMissionInput,
  type Mission,
  type MissionPeriod,
  type MissionRewardType,
  type MissionType,
} from '@/schemas/mission.schema'
import type { ExpirationConfig } from '@/schemas/reward.schema'
import dayjs from 'dayjs'
import { Loader2, Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const missionTypes: MissionType[] = ['single', 'count', 'streak', 'cumulative']
const missionPeriods: MissionPeriod[] = [
  'daily',
  'weekly',
  'weekly_mon',
  'weekly_sun',
  'weekly_fri',
  'monthly',
  'all_time',
]
const rewardTypes: MissionRewardType[] = ['turns', 'score']

// Trigger event options for combobox
const triggerEventOptions = predefinedTriggerEvents.map((event) => ({
  value: event,
  label: triggerEventLabels[event],
  description: event,
}))

// Combined tracking description based on period + type
const getTrackingDescription = (period: MissionPeriod, type: MissionType): string => {
  const periodText = period === 'all_time' ? 'lifetime' : missionPeriodLabels[period].toLowerCase()

  switch (type) {
    case 'single':
      return `Complete once${period === 'all_time' ? ' ever' : ` per ${periodText}`}`
    case 'count':
      return `Count different days${period === 'all_time' ? ' (not consecutive)' : `, resets ${periodText}`}`
    case 'streak':
      return `Complete on consecutive days${period === 'all_time' ? '' : `, resets ${periodText}`}`
    case 'cumulative':
      return `Accumulate value${period === 'all_time' ? ' over lifetime' : `, resets ${periodText}`}`
    default:
      return ''
  }
}

// Dynamic labels based on mission type
const getTargetValueConfig = (missionType: MissionType) => {
  switch (missionType) {
    case 'single':
      return {
        label: 'Target',
        hint: 'User completes the action once to finish',
        hidden: true, // Always 1 for single type
      }
    case 'count':
      return {
        label: 'Days Required',
        hint: 'User must complete the action on X different days (not consecutive)',
        hidden: false,
      }
    case 'streak':
      return {
        label: 'Streak Goal',
        hint: 'User must complete the action on X CONSECUTIVE days',
        hidden: false,
      }
    case 'cumulative':
      return {
        label: 'Target Value',
        hint: 'Total points/value to accumulate',
        hidden: false,
      }
    default:
      return {
        label: 'Target Value',
        hint: '',
        hidden: false,
      }
  }
}

const columnHelper = createColumnHelper<Mission>()

type SheetMode = 'closed' | 'create' | 'edit'

interface FormData {
  code: string
  name: string
  description: string
  imageUrl: string
  triggerEvent: string
  missionType: MissionType
  missionPeriod: MissionPeriod
  targetValue: number
  maxCompletions: number | null
  rewardType: MissionRewardType
  rewardValue: number
  displayOrder: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
  allowFeTrigger: boolean
  conditions: string
  rewardExpirationConfig: ExpirationConfig | null
}

const initialFormData: FormData = {
  code: '',
  name: '',
  description: '',
  imageUrl: '',
  triggerEvent: 'user:login',
  missionType: 'single',
  missionPeriod: 'daily',
  targetValue: 1,
  maxCompletions: null,
  rewardType: 'turns',
  rewardValue: 1,
  displayOrder: 0,
  startDate: null,
  endDate: null,
  isActive: true,
  allowFeTrigger: true,
  conditions: '',
  rewardExpirationConfig: null,
}

interface GameMissionsTabProps {
  gameId: string
}

export function GameMissionsTab({ gameId }: GameMissionsTabProps) {
  const { data: missions = [], isLoading } = useMissionsByGame(gameId)
  const createMission = useCreateMission()
  const updateMission = useUpdateMission()
  const deleteMission = useDeleteMission()

  const [sheetMode, setSheetMode] = useState<SheetMode>('closed')
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [sheetInitialData, setSheetInitialData] = useState<FormData>(initialFormData)

  // Track unsaved changes
  const { isDirty } = useUnsavedChanges({
    data: formData,
    initialData: sheetMode !== 'closed' ? sheetInitialData : undefined,
  })

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

  const columns = useMemo(
    () => [
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
      columnHelper.editable.toggle('isActive', 'Active', (row, value) =>
        handleInlineUpdate(row, 'isActive', value)
      ),
    ],
    [handleInlineUpdate]
  )

  const handleOpenCreate = () => {
    setSheetMode('create')
    setSelectedMission(null)
    setFormData(initialFormData)
    setSheetInitialData(initialFormData)
  }

  const handleRowClick = (mission: Mission) => {
    setSheetMode('edit')
    setSelectedMission(mission)
    const editFormData: FormData = {
      code: mission.code,
      name: mission.name,
      description: mission.description || '',
      imageUrl: mission.imageUrl || '',
      triggerEvent: mission.triggerEvent,
      missionType: mission.missionType,
      missionPeriod: mission.missionPeriod,
      targetValue: mission.targetValue,
      maxCompletions: mission.maxCompletions ?? null,
      rewardType: mission.rewardType,
      rewardValue: mission.rewardValue,
      displayOrder: mission.displayOrder,
      startDate: mission.startDate || null,
      endDate: mission.endDate || null,
      isActive: mission.isActive ?? true,
      allowFeTrigger: mission.allowFeTrigger ?? true,
      conditions: mission.conditions ? JSON.stringify(mission.conditions, null, 2) : '',
      rewardExpirationConfig: mission.rewardExpirationConfig || null,
    }
    setFormData(editFormData)
    setSheetInitialData(editFormData)
  }

  const handleClose = () => {
    setSheetMode('closed')
    setSelectedMission(null)
    setFormData(initialFormData)
  }

  const parseJsonField = (value: string) => {
    if (!value.trim()) return undefined
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }

  const handleSave = async () => {
    if (!formData.code || !formData.name) return

    const conditions = parseJsonField(formData.conditions)

    if (sheetMode === 'create') {
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
    } else if (sheetMode === 'edit' && selectedMission) {
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
    handleClose()
  }

  const isPending = createMission.isPending || updateMission.isPending || deleteMission.isPending
  const isCreate = sheetMode === 'create'

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

      <UnsavedChangesSheet
        open={sheetMode !== 'closed'}
        onOpenChange={(open) => !open && handleClose()}
        isDirty={isDirty}
      >
        <UnsavedChangesSheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isCreate ? 'Create Mission' : 'Edit Mission'}</SheetTitle>
            <SheetDescription>
              {isCreate
                ? 'Create a new mission with triggers and rewards'
                : `Editing: ${selectedMission?.code}`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-auto px-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="e.g., daily-login"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={!isCreate}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Mission name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextEditor
                  placeholder="Mission description..."
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                />
              </div>
            </div>

            {/* Trigger */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Trigger</h4>
              <div className="space-y-2">
                <Label>Trigger Event</Label>
                <Combobox
                  options={triggerEventOptions}
                  value={formData.triggerEvent}
                  onChange={(value) => setFormData({ ...formData, triggerEvent: value })}
                  placeholder="Select or type trigger event..."
                  searchPlaceholder="Search events..."
                  allowCustom
                  renderOption={(option) => (
                    <div className="flex items-center gap-2">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({option.value})
                      </span>
                    </div>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  What action triggers progress for this mission
                </p>
              </div>
            </div>

            {/* Tracking */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Tracking</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select
                    value={formData.missionPeriod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, missionPeriod: value as MissionPeriod })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {missionPeriods.map((period) => (
                        <SelectItem key={period} value={period}>
                          {missionPeriodLabels[period]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.missionType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, missionType: value as MissionType })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {missionTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {missionTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                {getTrackingDescription(formData.missionPeriod, formData.missionType)}
              </p>
            </div>

            {/* Completion */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Completion</h4>
              <div
                className={`grid grid-cols-${formData.missionType === 'single' ? '1' : '2'} gap-4`}
              >
                {/* Target Value - hidden for single type */}
                {formData.missionType !== 'single' && (
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">
                      {getTargetValueConfig(formData.missionType).label}
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      min={1}
                      value={formData.targetValue}
                      onChange={(e) =>
                        setFormData({ ...formData, targetValue: parseInt(e.target.value) || 1 })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {getTargetValueConfig(formData.missionType).hint}
                    </p>
                  </div>
                )}

                {/* Max Completions */}
                <div className="space-y-2">
                  <Label htmlFor="maxCompletions">Max Completions</Label>
                  <Input
                    id="maxCompletions"
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={formData.maxCompletions || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxCompletions: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.maxCompletions === null
                      ? `Unlimited completions per ${formData.missionPeriod === 'all_time' ? 'lifetime' : missionPeriodLabels[formData.missionPeriod].toLowerCase()}`
                      : formData.maxCompletions === 1
                        ? `Can only complete once ${formData.missionPeriod === 'all_time' ? 'ever' : 'per ' + missionPeriodLabels[formData.missionPeriod].toLowerCase()}`
                        : `Can complete ${formData.maxCompletions} times per ${formData.missionPeriod === 'all_time' ? 'lifetime' : missionPeriodLabels[formData.missionPeriod].toLowerCase()}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Reward */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Reward</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reward Type</Label>
                  <Select
                    value={formData.rewardType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, rewardType: value as MissionRewardType })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rewardTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {missionRewardTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rewardValue">Reward Value</Label>
                  <Input
                    id="rewardValue"
                    type="number"
                    min={0}
                    value={formData.rewardValue}
                    onChange={(e) =>
                      setFormData({ ...formData, rewardValue: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              {formData.rewardType === 'turns' && (
                <div className="space-y-2">
                  <Label>Turns Expiration</Label>
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <ExpirationEditor
                      value={formData.rewardExpirationConfig}
                      onChange={(config) =>
                        setFormData({ ...formData, rewardExpirationConfig: config })
                      }
                      itemLabel="turns"
                      description="Configure when turns expire after being granted."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Schedule</h4>
              <div className="space-y-2">
                <Label>Duration</Label>
                <DateRangePicker
                  value={{
                    from: formData.startDate ? dayjs(formData.startDate).toDate() : undefined,
                    to: formData.endDate ? dayjs(formData.endDate).toDate() : undefined,
                  }}
                  onChange={(range) =>
                    setFormData({
                      ...formData,
                      startDate: range?.from ? dayjs(range.from).toISOString() : null,
                      endDate: range?.to ? dayjs(range.to).toISOString() : null,
                    })
                  }
                  placeholder="Select date range"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Settings</h4>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowFeTrigger"
                    checked={formData.allowFeTrigger}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowFeTrigger: !!checked })
                    }
                  />
                  <Label htmlFor="allowFeTrigger" className="cursor-pointer">
                    Allow FE Trigger
                  </Label>
                </div>
              </div>
            </div>

            {/* Advanced */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Advanced</h4>
              <div className="space-y-2">
                <Label htmlFor="conditions">Conditions (JSON)</Label>
                <Textarea
                  id="conditions"
                  placeholder='{"field": "storeId", "op": "eq", "value": "store-001"}'
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  className="min-h-20 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Optional conditions for mission eligibility
                </p>
              </div>
            </div>

            {!isCreate && selectedMission?.createdAt && (
              <div className="space-y-2 pt-4 border-t">
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">
                  {dayjs(selectedMission.createdAt).format('MMMM D, YYYY')}
                </p>
              </div>
            )}
          </div>
          <SheetFooter className="flex-row gap-2">
            {!isCreate && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={!formData.code || !formData.name || isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isCreate ? 'Create Mission' : 'Save changes'}
            </Button>
          </SheetFooter>
        </UnsavedChangesSheetContent>
      </UnsavedChangesSheet>
    </Card>
  )
}
