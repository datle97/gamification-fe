import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { Reward } from '@/schemas/reward.schema'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface ProbabilityManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rewards: Reward[]
  onApply: (updates: { rewardId: string; probability: number }[]) => void
}

type DistributeMode = 'equal' | 'proportional'

// Round to 6 decimal places for precision
const roundProbability = (value: number): number => {
  return Math.round(value * 1000000) / 1000000
}

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
  const [searchQuery, setSearchQuery] = useState('')

  // Reset state to current reward values
  const resetState = () => {
    setProbabilities(new Map(rewards.map((r) => [r.rewardId, r.probability])))
    setSelectedIds(new Set())
    setTargetTotal('100')
    setDistributeMode('proportional')
    setSearchQuery('')
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

  // Filter rewards by search query
  const filteredRewards = useMemo(() => {
    if (!searchQuery.trim()) return rewards
    const query = searchQuery.toLowerCase()
    return rewards.filter((r) => r.name.toLowerCase().includes(query))
  }, [rewards, searchQuery])

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
      next.set(rewardId, roundProbability(Math.max(0, Math.min(100, value))))
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
      const perReward = roundProbability(target / selected.length)
      selected.forEach((id) => {
        newProbs.set(id, perReward)
      })
    } else {
      // Proportional distribution
      const currentSelectedTotal = selected.reduce(
        (sum, id) => sum + (probabilities.get(id) || 0),
        0
      )

      if (currentSelectedTotal > 0) {
        // Scale proportionally
        const scale = target / currentSelectedTotal
        selected.forEach((id) => {
          const current = probabilities.get(id) || 0
          newProbs.set(id, roundProbability(current * scale))
        })
      } else {
        // If all selected are 0, fallback to equal
        const perReward = roundProbability(target / selected.length)
        selected.forEach((id) => {
          newProbs.set(id, perReward)
        })
      }
    }

    setProbabilities(newProbs)
  }

  const setAllEqual = () => {
    const perReward = roundProbability(100 / rewards.length)
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
      probability,
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
      <DialogContent className="max-w-7xl! max-h-[85vh] flex flex-col top-[5%] translate-y-0">
        <DialogHeader>
          <DialogTitle>Manage Probabilities</DialogTitle>
          <DialogDescription>
            Adjust reward probabilities individually or in bulk. Total:{' '}
            {totalProbability.toFixed(2)}%
          </DialogDescription>
        </DialogHeader>

        {/* 2-Column Layout */}
        <div className="flex-1 flex gap-6 min-h-0 px-6">
          {/* Left Column - Rewards List */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Select All + Stats */}
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg mb-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === rewards.length && rewards.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <Label className="cursor-pointer text-sm" onClick={toggleSelectAll}>
                  Select All
                </Label>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedCount}/{rewards.length} selected ({selectedTotal.toFixed(1)}%)
              </div>
            </div>

            {/* Scrollable Rewards List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredRewards.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No rewards match your search' : 'No rewards available'}
                </div>
              ) : (
                filteredRewards.map((reward) => {
                  const prob = probabilities.get(reward.rewardId) || 0
                  const isSelected = selectedIds.has(reward.rewardId)
                  const barWidth =
                    totalProbability > 0 ? Math.min(100, (prob / totalProbability) * 100) : 0

                  return (
                    <div
                      key={reward.rewardId}
                      className={`flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors ${
                        isSelected ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(reward.rewardId)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{reward.name}</div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.000001}
                        value={prob}
                        onChange={(e) =>
                          setProbability(reward.rewardId, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 h-8 text-sm tabular-nums"
                      />
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column - Tools */}
          <div className="w-72 shrink-0 space-y-3">
            {/* Quick Actions - applies to ALL */}
            <div className="p-3 border rounded-lg space-y-2">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                Quick Actions
              </h4>
              <Button variant="outline" size="sm" onClick={setAllEqual} className="w-full text-xs">
                Distribute All Equally
              </Button>
            </div>

            {/* Selected Actions */}
            <div
              className={`p-3 border rounded-lg space-y-3 ${selectedCount === 0 ? 'opacity-50' : ''}`}
            >
              <h4 className="font-semibold text-sm">
                {selectedCount > 0 ? `${selectedCount} Selected` : 'No Selection'}
                {selectedCount > 0 && (
                  <span className="font-normal text-muted-foreground ml-1">
                    ({selectedTotal.toFixed(1)}%)
                  </span>
                )}
              </h4>

              <div className="space-y-2">
                <Label className="text-xs">Set total to (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={targetTotal}
                  onChange={(e) => setTargetTotal(e.target.value)}
                  disabled={selectedCount === 0}
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Distribution mode</Label>
                <RadioGroup
                  value={distributeMode}
                  onValueChange={(v) => setDistributeMode(v as DistributeMode)}
                  disabled={selectedCount === 0}
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="equal" id="equal" disabled={selectedCount === 0} />
                    <Label htmlFor="equal" className="cursor-pointer font-normal text-xs">
                      Equally
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="proportional"
                      id="proportional"
                      disabled={selectedCount === 0}
                    />
                    <Label htmlFor="proportional" className="cursor-pointer font-normal text-xs">
                      Proportionally
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={distributeToSelected}
                disabled={selectedCount === 0}
                className="w-full"
                size="sm"
              >
                Apply to Selected
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={clearSelected}
                disabled={selectedCount === 0}
                className="w-full text-xs"
              >
                Set Selected to 0%
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
