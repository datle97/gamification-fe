import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Reward } from '@/schemas/reward.schema'

interface ProbabilityManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rewards: Reward[]
  onApply: (updates: { rewardId: string; probability: number }[]) => void
}

type DistributeMode = 'equal' | 'proportional'

export function ProbabilityManagerDialog({
  open,
  onOpenChange,
  rewards,
  onApply,
}: ProbabilityManagerDialogProps) {
  // State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [probabilities, setProbabilities] = useState<Map<string, number>>(
    new Map(rewards.map((r) => [r.rewardId, r.probability]))
  )
  const [targetTotal, setTargetTotal] = useState<string>('100')
  const [distributeMode, setDistributeMode] = useState<DistributeMode>('proportional')

  // Reset state to current reward values
  const resetState = () => {
    setProbabilities(new Map(rewards.map((r) => [r.rewardId, r.probability])))
    setSelectedIds(new Set())
    setTargetTotal('100')
    setDistributeMode('proportional')
  }

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      resetState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Computed values
  const totalProbability = useMemo(() => {
    return Array.from(probabilities.values()).reduce((sum, p) => sum + p, 0)
  }, [probabilities])

  const selectedTotal = useMemo(() => {
    return Array.from(selectedIds).reduce((sum, id) => {
      return sum + (probabilities.get(id) || 0)
    }, 0)
  }, [selectedIds, probabilities])

  const selectedCount = selectedIds.size

  // Handlers
  const toggleSelect = (rewardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(rewardId)) {
        next.delete(rewardId)
      } else {
        next.add(rewardId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === rewards.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(rewards.map((r) => r.rewardId)))
    }
  }

  const setProbability = (rewardId: string, value: number) => {
    setProbabilities((prev) => {
      const next = new Map(prev)
      next.set(rewardId, Math.max(0, Math.min(100, value)))
      return next
    })
  }

  const distributeToSelected = () => {
    const target = parseFloat(targetTotal) || 0
    const selected = Array.from(selectedIds)

    if (selected.length === 0) return

    const newProbs = new Map(probabilities)

    if (distributeMode === 'equal') {
      // Distribute equally among selected
      const perReward = target / selected.length
      selected.forEach((id) => {
        newProbs.set(id, perReward)
      })
    } else {
      // Proportional distribution
      const currentSelectedTotal = selected.reduce((sum, id) => sum + (probabilities.get(id) || 0), 0)

      if (currentSelectedTotal > 0) {
        // Scale proportionally
        const scale = target / currentSelectedTotal
        selected.forEach((id) => {
          const current = probabilities.get(id) || 0
          newProbs.set(id, current * scale)
        })
      } else {
        // If all selected are 0, fallback to equal
        const perReward = target / selected.length
        selected.forEach((id) => {
          newProbs.set(id, perReward)
        })
      }
    }

    setProbabilities(newProbs)
  }

  const setAllEqual = () => {
    const perReward = 100 / rewards.length
    setProbabilities(new Map(rewards.map((r) => [r.rewardId, perReward])))
  }

  const clearSelected = () => {
    const newProbs = new Map(probabilities)
    selectedIds.forEach((id) => {
      newProbs.set(id, 0)
    })
    setProbabilities(newProbs)
  }

  const handleApply = () => {
    const updates = Array.from(probabilities.entries()).map(([rewardId, probability]) => ({
      rewardId,
      probability: Math.round(probability * 1000000) / 1000000, // Round to 6 decimals
    }))
    onApply(updates)
    onOpenChange(false)
  }

  const handleCancel = () => {
    resetState()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl! max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Probabilities</DialogTitle>
          <DialogDescription>
            Adjust reward probabilities individually or in bulk. Total: {totalProbability.toFixed(2)}%
          </DialogDescription>
        </DialogHeader>

        {/* Select All + Total */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mx-6">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === rewards.length && rewards.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <Label className="cursor-pointer" onClick={toggleSelectAll}>
              Select All
            </Label>
          </div>
          <div className="text-sm font-medium">
            Selected: {selectedCount} / {rewards.length} ({selectedTotal.toFixed(2)}%)
          </div>
        </div>

        {/* Scrollable Rewards List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {rewards.map((reward) => {
            const prob = probabilities.get(reward.rewardId) || 0
            const isSelected = selectedIds.has(reward.rewardId)
            // Calculate bar width relative to total (max 100%)
            const barWidth = totalProbability > 0 ? Math.min(100, (prob / totalProbability) * 100) : 0

            return (
              <div
                key={reward.rewardId}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
              >
                {/* Checkbox */}
                <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(reward.rewardId)} />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{reward.name}</div>
                </div>

                {/* Progress Bar */}
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* Probability Input */}
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.000001}
                  value={prob}
                  onChange={(e) => setProbability(reward.rewardId, parseFloat(e.target.value) || 0)}
                  className="w-28 tabular-nums"
                />
              </div>
            )
          })}
        </div>

        {/* Bulk Actions - Always visible at bottom */}
        <div className="border-t bg-background px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">
              {selectedCount > 0 ? `Actions for ${selectedCount} selected` : 'Select rewards to adjust'}
            </h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={setAllEqual}>
                Equal All
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelected} disabled={selectedCount === 0}>
                Clear Selected
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Set total to (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={targetTotal}
                onChange={(e) => setTargetTotal(e.target.value)}
                disabled={selectedCount === 0}
              />
            </div>

            <div className="space-y-2">
              <Label>Distribution mode</Label>
              <RadioGroup
                value={distributeMode}
                onValueChange={(v) => setDistributeMode(v as DistributeMode)}
                disabled={selectedCount === 0}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="equal" id="equal" disabled={selectedCount === 0} />
                  <Label htmlFor="equal" className="cursor-pointer font-normal">
                    Distribute equally
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="proportional" id="proportional" disabled={selectedCount === 0} />
                  <Label htmlFor="proportional" className="cursor-pointer font-normal">
                    Distribute proportionally
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Button onClick={distributeToSelected} disabled={selectedCount === 0} className="w-full">
            Apply Distribution
          </Button>
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
