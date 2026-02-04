import { ExpirationEditor } from '@/components/common/ExpirationEditor'
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  UnsavedChangesDialog,
  UnsavedChangesDialogContent,
} from '@/components/common/unsaved-changes-dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ExpirationConfig, Reward } from '@/schemas/reward.schema'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ConditionsTab } from './reward-tabs/ConditionsTab'
import { SharingTab } from './reward-tabs/SharingTab'

interface BulkEditRewardsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedRewards: Reward[]
  gameId: string
  onApply: (updates: { rewardId: string; data: Partial<Reward> }[]) => Promise<void>
}

// Fields that can be bulk-edited
type BulkField = 'probability' | 'quota' | 'expirationConfig' | 'conditions' | 'shareConfig'

interface BulkFieldConfig {
  key: BulkField
  label: string
  description: string
}

const BULK_FIELDS: BulkFieldConfig[] = [
  { key: 'probability', label: 'Probability', description: 'Set probability for all selected rewards' },
  { key: 'quota', label: 'Quota', description: 'Set quota limit (leave empty for unlimited)' },
{ key: 'expirationConfig', label: 'Expiration', description: 'Set expiration rules for selected rewards' },
  { key: 'conditions', label: 'Conditions', description: 'Replace conditions for all selected rewards' },
  { key: 'shareConfig', label: 'Sharing', description: 'Replace sharing config for all selected rewards' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseJsonField = (value: string): any => {
  if (!value.trim()) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

export function BulkEditRewardsDialog({
  open,
  onOpenChange,
  selectedRewards,
  gameId,
  onApply,
}: BulkEditRewardsDialogProps) {
  // Which fields are enabled for bulk edit
  const [enabledFields, setEnabledFields] = useState<Set<BulkField>>(new Set())

  // Field values
  const [probability, setProbability] = useState<number>(0)
  const [quota, setQuota] = useState<string>('')
  const [expirationConfig, setExpirationConfig] = useState<ExpirationConfig | null>(null)
  const [conditions, setConditions] = useState<string>('')
  const [shareConfig, setShareConfig] = useState<string>('')
  const [isPending, setIsPending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setEnabledFields(new Set())
      setProbability(0)
      setQuota('')
      setExpirationConfig(null)
      setConditions('')
      setShareConfig('')
      setIsPending(false)
      setShowConfirm(false)
    }
  }, [open])

  const isDirty = enabledFields.size > 0

  const toggleField = (field: BulkField) => {
    setEnabledFields((prev) => {
      const next = new Set(prev)
      if (next.has(field)) {
        next.delete(field)
      } else {
        next.add(field)
      }
      return next
    })
  }

  // Build the update payload
  const buildUpdates = useMemo(() => {
    if (enabledFields.size === 0) return []

    return selectedRewards.map((reward) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: Record<string, any> = {}
      if (enabledFields.has('probability')) {
        data.probability = probability
      }
      if (enabledFields.has('quota')) {
        data.quota = quota.trim() === '' ? null : parseInt(quota, 10)
      }
      if (enabledFields.has('expirationConfig')) {
        data.expirationConfig = expirationConfig
      }
      if (enabledFields.has('conditions')) {
        data.conditions = parseJsonField(conditions)
      }
      if (enabledFields.has('shareConfig')) {
        data.shareConfig = parseJsonField(shareConfig)
      }
      return { rewardId: reward.rewardId, data }
    })
  }, [enabledFields, selectedRewards, probability, quota, expirationConfig, conditions, shareConfig])

  const handleApply = async () => {
    if (buildUpdates.length === 0) return
    setIsPending(true)
    try {
      await onApply(buildUpdates)
      onOpenChange(false)
    } finally {
      setIsPending(false)
    }
  }

  // Summary of changes for preview
  const changeSummary = useMemo(() => {
    const items: string[] = []
    if (enabledFields.has('probability')) items.push(`Probability → ${probability}%`)
    if (enabledFields.has('quota')) items.push(`Quota → ${quota.trim() === '' ? 'Unlimited' : quota}`)
    if (enabledFields.has('expirationConfig')) {
      const mode = expirationConfig?.mode ?? 'permanent'
      items.push(`Expiration → ${mode}`)
    }
    if (enabledFields.has('conditions')) items.push('Conditions → (configured)')
    if (enabledFields.has('shareConfig')) items.push('Sharing → (configured)')
    return items
  }, [enabledFields, probability, quota, expirationConfig])

  const renderFieldEditor = (fieldKey: BulkField) => {
    switch (fieldKey) {
      case 'probability':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={probability}
              onChange={(e) => setProbability(parseFloat(e.target.value) || 0)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        )
      case 'quota':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              placeholder="Leave empty for unlimited"
              className="w-48"
            />
          </div>
        )
      case 'expirationConfig':
        return (
          <ExpirationEditor
            value={expirationConfig}
            onChange={setExpirationConfig}
            itemLabel="rewards"
          />
        )
      case 'conditions':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>This will replace existing conditions on all selected rewards.</span>
            </div>
            <ConditionsTab
              conditions={conditions}
              onChange={setConditions}
              gameId={gameId}
            />
          </div>
        )
      case 'shareConfig':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>This will replace existing sharing config on all selected rewards.</span>
            </div>
            <SharingTab
              shareConfig={shareConfig}
              onChange={setShareConfig}
            />
          </div>
        )
    }
  }

  return (
    <UnsavedChangesDialog open={open} onOpenChange={onOpenChange} isDirty={isDirty}>
      <UnsavedChangesDialogContent
        className={'max-w-6xl! w-[95vw] max-h-[85vh] flex flex-col top-[5%] translate-y-0'}
      >
        <DialogHeader>
          <DialogTitle>Bulk Edit {selectedRewards.length} Rewards</DialogTitle>
          <DialogDescription>
            Select fields to update. Changes will be applied to all selected rewards.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Selected rewards summary */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Selected rewards:</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedRewards.map((r) => (
                <span
                  key={r.rewardId}
                  className="inline-flex items-center px-2 py-0.5 text-xs bg-background border rounded-md"
                >
                  {r.name}
                </span>
              ))}
            </div>
          </div>

          {/* Field editors */}
          <div className="space-y-3">
            {BULK_FIELDS.map((field) => {
              const isEnabled = enabledFields.has(field.key)
              return (
                <div key={field.key} className="border rounded-lg">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => toggleField(field.key)}
                  >
                    <Checkbox
                      checked={isEnabled}
                      onCheckedChange={() => toggleField(field.key)}
                    />
                    <div className="flex-1">
                      <Label className="font-medium cursor-pointer">{field.label}</Label>
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    </div>
                  </div>

                  {isEnabled && (
                    <div className="px-4 pb-4 pt-0" onClick={(e) => e.stopPropagation()}>
                      {renderFieldEditor(field.key)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Preview */}
          {changeSummary.length > 0 && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Preview changes:</p>
              <ul className="space-y-1">
                {changeSummary.map((item) => (
                  <li key={item} className="text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={enabledFields.size === 0 || isPending}
          >
            Apply to {selectedRewards.length} Reward{selectedRewards.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </UnsavedChangesDialogContent>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Edit</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Apply the following changes to{' '}
                  <strong>{selectedRewards.length} reward{selectedRewards.length !== 1 ? 's' : ''}</strong>?
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {changeSummary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesDialog>
  )
}
