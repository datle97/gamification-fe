import { useState, useMemo, useCallback } from 'react'
import dayjs from 'dayjs'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createColumnHelper } from '@/lib/column-helper'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { DateRangePicker } from '@/components/ui/date-range-picker'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useMissionsByGame,
  useCreateMission,
  useUpdateMission,
  useDeleteMission,
} from '@/hooks/queries'
import {
  missionTypeLabels,
  missionPeriodLabels,
  missionRewardTypeLabels,
  triggerEventLabels,
  type Mission,
  type MissionType,
  type TriggerEvent,
  type MissionPeriod,
  type MissionRewardType,
  type CreateMissionInput,
} from '@/schemas/mission.schema'

const missionTypes: MissionType[] = ['single', 'count', 'streak', 'cumulative']
const triggerEvents: TriggerEvent[] = [
  'user:login',
  'zma:checkin',
  'game:play',
  'game:share',
  'share:reward',
  'share:position',
  'bill:payment',
  'booking:create',
  'coupon:redeem',
  'tier:upgrade',
  'points:earn',
]
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

const columnHelper = createColumnHelper<Mission>()

type SheetMode = 'closed' | 'create' | 'edit'

interface FormData {
  code: string
  name: string
  description: string
  imageUrl: string
  triggerEvent: TriggerEvent
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
  rewardExpirationConfig: string
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
  rewardExpirationConfig: '',
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

  const handleInlineUpdate = useCallback(
    async (mission: Mission, field: string, value: unknown) => {
      await updateMission.mutateAsync({
        id: mission.missionId,
        data: { [field]: value },
      })
    },
    [updateMission]
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
  }

  const handleRowClick = (mission: Mission) => {
    setSheetMode('edit')
    setSelectedMission(mission)
    setFormData({
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
      rewardExpirationConfig: mission.rewardExpirationConfig
        ? JSON.stringify(mission.rewardExpirationConfig, null, 2)
        : '',
    })
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
    const rewardExpirationConfig = parseJsonField(formData.rewardExpirationConfig)

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
        rewardExpirationConfig,
        gameId,
      } as CreateMissionInput)
    } else if (sheetMode === 'edit' && selectedMission) {
      await updateMission.mutateAsync({
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
          rewardExpirationConfig,
        },
      })
    }

    handleClose()
  }

  const handleDelete = async () => {
    if (!selectedMission) return
    await deleteMission.mutateAsync(selectedMission.missionId)
    handleClose()
  }

  const isPending = createMission.isPending || updateMission.isPending || deleteMission.isPending
  const isCreate = sheetMode === 'create'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Missions</CardTitle>
            <CardDescription>Manage missions for this game</CardDescription>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Mission
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={missions}
          loading={isLoading}
          emptyMessage="No missions yet. Create your first mission for this game."
          onRowClick={handleRowClick}
        />
      </CardContent>

      <Sheet open={sheetMode !== 'closed'} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Mission description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-16"
                />
              </div>
            </div>

            {/* Trigger & Type */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Trigger & Type</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger Event</Label>
                  <Select
                    value={formData.triggerEvent}
                    onValueChange={(value) =>
                      setFormData({ ...formData, triggerEvent: value as TriggerEvent })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerEvents.map((event) => (
                        <SelectItem key={event} value={event}>
                          {triggerEventLabels[event]}
                          <span className="ml-2 text-xs text-muted-foreground font-mono">
                            ({event})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mission Type</Label>
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
              <div className="space-y-2">
                <Label>Mission Period</Label>
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
            </div>

            {/* Completion */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Completion</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetValue">Target Value</Label>
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
                    How many times to complete the action
                  </p>
                </div>
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
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
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
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
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
              <div className="space-y-2">
                <Label htmlFor="rewardExpirationConfig">Reward Expiration Config (JSON)</Label>
                <Textarea
                  id="rewardExpirationConfig"
                  placeholder='{"mode": "ttl", "ttlDays": 30}'
                  value={formData.rewardExpirationConfig}
                  onChange={(e) =>
                    setFormData({ ...formData, rewardExpirationConfig: e.target.value })
                  }
                  className="min-h-20 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Expiration settings for mission rewards (turns/score)
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
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.code || !formData.name || isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isCreate ? 'Create Mission' : 'Save changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  )
}
