/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { ExpirationEditor } from '@/components/common/ExpirationEditor'
import { RichTextEditor } from '@/components/common/lazy-rich-text-editor'
import { MissionCyclePreview } from '@/components/common/MissionCyclePreview'
import {
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  UnsavedChangesDialog,
  UnsavedChangesDialogContent,
} from '@/components/common/unsaved-changes-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Combobox } from '@/components/ui/combobox'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import {
  missionPeriodLabels,
  missionRewardTypeLabels,
  missionTypeLabels,
  predefinedTriggerEvents,
  triggerEventLabels,
  type Mission,
  type MissionPeriod,
  type MissionRewardType,
  type MissionType,
} from '@/schemas/mission.schema'
import type { ExpirationConfig } from '@/schemas/reward.schema'
import dayjs from 'dayjs'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

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

const triggerEventOptions = predefinedTriggerEvents.map((event) => ({
  value: event,
  label: triggerEventLabels[event],
  description: event,
}))

const getTargetValueConfig = (missionType: MissionType) => {
  switch (missionType) {
    case 'single':
      return { label: 'Target', hidden: true }
    case 'count':
      return { label: 'Days Required', hidden: false }
    case 'streak':
      return { label: 'Streak Goal', hidden: false }
    case 'cumulative':
      return { label: 'Target Value', hidden: false }
    default:
      return { label: 'Target Value', hidden: false }
  }
}

export interface MissionFormData {
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

export const initialMissionFormData: MissionFormData = {
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

export function missionToFormData(mission: Mission): MissionFormData {
  return {
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
}

interface MissionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  mission?: Mission | null
  initialData?: MissionFormData
  onSave: (data: MissionFormData) => Promise<void>
  isPending?: boolean
}

export function MissionFormDialog({
  open,
  onOpenChange,
  mode,
  mission,
  initialData,
  onSave,
  isPending = false,
}: MissionFormDialogProps) {
  const isCreate = mode === 'create'
  const defaultData = initialData || (mission ? missionToFormData(mission) : initialMissionFormData)

  const [formData, setFormData] = useState<MissionFormData>(defaultData)
  const [dialogInitialData, setDialogInitialData] = useState<MissionFormData>(defaultData)

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      const data = initialData || (mission ? missionToFormData(mission) : initialMissionFormData)
      setFormData(data)
      setDialogInitialData(data)
    }
  }, [open, mission, initialData])

  const { isDirty } = useUnsavedChanges({
    data: formData,
    initialData: open ? dialogInitialData : undefined,
  })

  const handleSave = async () => {
    if (!formData.code || !formData.name) return
    await onSave(formData)
  }

  return (
    <UnsavedChangesDialog open={open} onOpenChange={onOpenChange} isDirty={isDirty}>
      <UnsavedChangesDialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Create Mission' : 'Edit Mission'}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Create a new mission with triggers and rewards'
              : `Editing: ${mission?.code}`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex-row">
          {/* Left: Form */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-5 pb-2">
              {/* Basic Info */}
              <div className="space-y-3">
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
              <div className="space-y-3 pt-3 border-t">
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
                </div>
              </div>

              {/* How It Works */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-sm font-medium text-muted-foreground">How It Works</h4>
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
                <div className="grid grid-cols-2 gap-4">
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
                    </div>
                  )}
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
                  </div>
                </div>
              </div>

              {/* Reward */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-sm font-medium text-muted-foreground">Reward</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reward Type</Label>
                    <Select
                      value={formData.rewardType}
                      onValueChange={(value) => {
                        const newType = value as MissionRewardType
                        setFormData({
                          ...formData,
                          rewardType: newType,
                          rewardExpirationConfig: newType === 'turns' ? formData.rewardExpirationConfig : null,
                        })
                      }}
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
              <div className="space-y-3 pt-3 border-t">
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
              <div className="space-y-3 pt-3 border-t">
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
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: !!checked })
                      }
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
              <div className="space-y-3 pt-3 border-t">
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
                </div>
              </div>

              {!isCreate && mission?.createdAt && (
                <div className="space-y-2 pt-3 border-t">
                  <Label>Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {dayjs(mission.createdAt).format('MMMM D, YYYY')}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Right: Preview */}
          <ScrollArea className="w-96 shrink-0 border-l pl-4">
            <MissionCyclePreview formData={formData} className="pb-2" />
          </ScrollArea>
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!formData.code || !formData.name || isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isCreate ? 'Create Mission' : 'Save changes'}
          </Button>
        </DialogFooter>
      </UnsavedChangesDialogContent>
    </UnsavedChangesDialog>
  )
}
