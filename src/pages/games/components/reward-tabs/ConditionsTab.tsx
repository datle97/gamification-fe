import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRewardsByGame } from '@/hooks/useRewards'
import type { RequiresRewardsCondition, RewardConditions } from '@/schemas/reward.schema'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'

interface ConditionsTabProps {
  conditions: string
  onChange: (conditions: string) => void
  gameId: string
}

export function ConditionsTab({ conditions, onChange, gameId }: ConditionsTabProps) {
  const { data: rewards = [] } = useRewardsByGame(gameId)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    requiresRewards: true,
    timeWindow: false,
    uniqueness: false,
    leaderboardScore: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const getConditions = (): RewardConditions => {
    try {
      return conditions ? JSON.parse(conditions) : {}
    } catch {
      return {}
    }
  }

  const updateConditions = (updates: Partial<RewardConditions>) => {
    const current = getConditions()
    const updated = { ...current, ...updates }

    // Clean up empty objects
    Object.keys(updated).forEach((key) => {
      const value = updated[key as keyof RewardConditions]
      if (value && typeof value === 'object' && Object.keys(value).length === 0) {
        delete updated[key as keyof RewardConditions]
      }
    })

    onChange(Object.keys(updated).length > 0 ? JSON.stringify(updated, null, 2) : '')
  }

  const conds = getConditions()

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Define conditions that must be met before a reward can be allocated. Leave empty for no
        restrictions.
      </div>

      {/* Collection Requirements Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('requiresRewards')}
        >
          <div className="flex items-center gap-2">
            {expandedSections.requiresRewards ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">Collection Requirements</span>
          </div>
          {conds.requiresRewards && (
            <span className="text-xs text-muted-foreground">Configured</span>
          )}
        </button>
        {expandedSections.requiresRewards && (
          <div className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Require user to own specific rewards before unlocking this reward
            </p>
            <div className="space-y-2">
              <Label htmlFor="rewardIds">Required Rewards</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  const currentCondition = !Array.isArray(conds.requiresRewards)
                    ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                    : undefined
                  const currentRewardIds = currentCondition?.rewardIds
                  const newRewardIds = currentRewardIds ? [...currentRewardIds, value] : [value]
                  updateConditions({
                    requiresRewards: {
                      ...currentCondition,
                      rewardIds: newRewardIds,
                      mode: currentCondition?.mode || 'all',
                    },
                  })
                }}
              >
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Select a reward to add" />
                </SelectTrigger>
                <SelectContent>
                  {rewards
                    .filter((r) => {
                      const currentCondition = !Array.isArray(conds.requiresRewards)
                        ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                        : undefined
                      const currentRewardIds = currentCondition?.rewardIds
                      return !currentRewardIds?.includes(r.rewardId)
                    })
                    .map((reward) => (
                      <SelectItem key={reward.rewardId} value={reward.rewardId}>
                        {reward.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {(() => {
                const currentCondition = !Array.isArray(conds.requiresRewards)
                  ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                  : undefined
                const currentRewardIds = currentCondition?.rewardIds
                return (
                  currentRewardIds &&
                  currentRewardIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentRewardIds.map((rewardId: string) => {
                        const reward = rewards.find((r) => r.rewardId === rewardId)
                        return (
                          <Badge key={rewardId} variant="secondary" className="pl-2 pr-1">
                            {reward?.name || rewardId}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 ml-2 hover:bg-transparent"
                              onClick={() => {
                                const newRewardIds = currentRewardIds.filter(
                                  (id: string) => id !== rewardId
                                )
                                updateConditions({
                                  requiresRewards:
                                    newRewardIds.length > 0
                                      ? {
                                          ...currentCondition,
                                          rewardIds: newRewardIds,
                                        }
                                      : undefined,
                                })
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        )
                      })}
                    </div>
                  )
                )
              })()}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requireMode">Mode</Label>
                <Select
                  value={(() => {
                    const currentCondition = !Array.isArray(conds.requiresRewards)
                      ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                      : undefined
                    return currentCondition?.mode || 'all'
                  })()}
                  onValueChange={(value: 'all' | 'any') => {
                    const currentCondition = !Array.isArray(conds.requiresRewards)
                      ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                      : undefined
                    updateConditions({
                      requiresRewards: currentCondition?.rewardIds
                        ? { ...currentCondition, mode: value }
                        : undefined,
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All - Must have all rewards</SelectItem>
                    <SelectItem value="any">Any - Must have at least N rewards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requireCount">Count (for "Any" mode)</Label>
                <Input
                  id="requireCount"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={(() => {
                    const currentCondition = !Array.isArray(conds.requiresRewards)
                      ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                      : undefined
                    return currentCondition?.count ?? ''
                  })()}
                  onChange={(e) => {
                    const value = e.target.value
                    const currentCondition = !Array.isArray(conds.requiresRewards)
                      ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                      : undefined
                    updateConditions({
                      requiresRewards: currentCondition?.rewardIds
                        ? { ...currentCondition, count: value ? parseInt(value) : undefined }
                        : undefined,
                    })
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Example: Unlock special reward #9 only after collecting 5 out of 8 mascots
            </p>
          </div>
        )}
      </div>

      {/* Uniqueness Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('uniqueness')}
        >
          <div className="flex items-center gap-2">
            {expandedSections.uniqueness ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">Duplicate Prevention</span>
          </div>
          {conds.uniqueness && <span className="text-xs text-muted-foreground">Configured</span>}
        </button>
        {expandedSections.uniqueness && (
          <div className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Control how many times a user can receive this reward
            </p>
            <div className="space-y-2">
              <Label htmlFor="maxPerUser">Max Per User</Label>
              <Input
                id="maxPerUser"
                type="number"
                min={1}
                placeholder="Unlimited"
                value={conds.uniqueness?.maxPerUser ?? ''}
                onChange={(e) =>
                  updateConditions({
                    uniqueness: e.target.value
                      ? { maxPerUser: parseInt(e.target.value) }
                      : undefined,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited. Set to 1 for limited edition rewards.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Time Window Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('timeWindow')}
        >
          <div className="flex items-center gap-2">
            {expandedSections.timeWindow ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">Time Window</span>
          </div>
          {conds.timeWindow && <span className="text-xs text-muted-foreground">Configured</span>}
        </button>
        {expandedSections.timeWindow && (
          <div className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Unlock this reward only during specific time windows
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={
                    conds.timeWindow?.startDate
                      ? new Date(conds.timeWindow.startDate).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    updateConditions({
                      timeWindow: {
                        ...conds.timeWindow,
                        startDate: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={
                    conds.timeWindow?.endDate
                      ? new Date(conds.timeWindow.endDate).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    updateConditions({
                      timeWindow: {
                        ...conds.timeWindow,
                        endDate: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Active Hours (24h format)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="hours"
                    type="number"
                    min={0}
                    max={23}
                    placeholder="Start"
                    value={conds.timeWindow?.hours?.[0] ?? ''}
                    onChange={(e) =>
                      updateConditions({
                        timeWindow: {
                          ...conds.timeWindow,
                          hours: [
                            parseInt(e.target.value) || 0,
                            conds.timeWindow?.hours?.[1] ?? 23,
                          ],
                        },
                      })
                    }
                  />
                  <span>-</span>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    placeholder="End"
                    value={conds.timeWindow?.hours?.[1] ?? ''}
                    onChange={(e) =>
                      updateConditions({
                        timeWindow: {
                          ...conds.timeWindow,
                          hours: [
                            conds.timeWindow?.hours?.[0] ?? 0,
                            parseInt(e.target.value) || 23,
                          ],
                        },
                      })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">e.g., 9-17 for 9am-5pm</p>
              </div>
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="flex items-center space-x-1">
                      <Checkbox
                        id={`day-${index}`}
                        checked={conds.timeWindow?.daysOfWeek?.includes(index) ?? false}
                        onCheckedChange={(checked) => {
                          const current = conds.timeWindow?.daysOfWeek ?? []
                          const updated = checked
                            ? [...current, index].sort()
                            : current.filter((d: number) => d !== index)
                          updateConditions({
                            timeWindow: {
                              ...conds.timeWindow,
                              daysOfWeek: updated.length > 0 ? updated : undefined,
                            },
                          })
                        }}
                      />
                      <Label htmlFor={`day-${index}`} className="text-xs cursor-pointer">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Segment Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('userSegment')}
        >
          <div className="flex items-center gap-2">
            {expandedSections.userSegment ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">User Segment</span>
          </div>
          {conds.requiresUserSegment && (
            <span className="text-xs text-muted-foreground">Configured</span>
          )}
        </button>
        {expandedSections.userSegment && (
          <div className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Target specific users by ID or phone number
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userIds">Whitelist User IDs (comma-separated)</Label>
                <Input
                  id="userIds"
                  placeholder="user-123, user-456"
                  value={conds.requiresUserSegment?.userIds?.join(', ') ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const userIds = value
                      ? value
                          .split(',')
                          .map((id) => id.trim())
                          .filter(Boolean)
                      : undefined
                    updateConditions({
                      requiresUserSegment: userIds
                        ? { ...conds.requiresUserSegment, userIds }
                        : conds.requiresUserSegment?.phoneNumbers ||
                            conds.requiresUserSegment?.excludeUserIds ||
                            conds.requiresUserSegment?.excludePhoneNumbers
                          ? { ...conds.requiresUserSegment, userIds: undefined }
                          : undefined,
                    })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumbers">Whitelist Phone Numbers (comma-separated)</Label>
                <Input
                  id="phoneNumbers"
                  placeholder="+84901234567, +84912345678"
                  value={conds.requiresUserSegment?.phoneNumbers?.join(', ') ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const phoneNumbers = value
                      ? value
                          .split(',')
                          .map((phone) => phone.trim())
                          .filter(Boolean)
                      : undefined
                    updateConditions({
                      requiresUserSegment: phoneNumbers
                        ? { ...conds.requiresUserSegment, phoneNumbers }
                        : conds.requiresUserSegment?.userIds ||
                            conds.requiresUserSegment?.excludeUserIds ||
                            conds.requiresUserSegment?.excludePhoneNumbers
                          ? { ...conds.requiresUserSegment, phoneNumbers: undefined }
                          : undefined,
                    })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excludeUserIds">Blacklist User IDs (comma-separated)</Label>
                <Input
                  id="excludeUserIds"
                  placeholder="user-789, user-012"
                  value={conds.requiresUserSegment?.excludeUserIds?.join(', ') ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const excludeUserIds = value
                      ? value
                          .split(',')
                          .map((id) => id.trim())
                          .filter(Boolean)
                      : undefined
                    updateConditions({
                      requiresUserSegment: excludeUserIds
                        ? { ...conds.requiresUserSegment, excludeUserIds }
                        : conds.requiresUserSegment?.userIds ||
                            conds.requiresUserSegment?.phoneNumbers ||
                            conds.requiresUserSegment?.excludePhoneNumbers
                          ? { ...conds.requiresUserSegment, excludeUserIds: undefined }
                          : undefined,
                    })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excludePhoneNumbers">
                  Blacklist Phone Numbers (comma-separated)
                </Label>
                <Input
                  id="excludePhoneNumbers"
                  placeholder="+84923456789"
                  value={conds.requiresUserSegment?.excludePhoneNumbers?.join(', ') ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const excludePhoneNumbers = value
                      ? value
                          .split(',')
                          .map((phone) => phone.trim())
                          .filter(Boolean)
                      : undefined
                    updateConditions({
                      requiresUserSegment: excludePhoneNumbers
                        ? { ...conds.requiresUserSegment, excludePhoneNumbers }
                        : conds.requiresUserSegment?.userIds ||
                            conds.requiresUserSegment?.phoneNumbers ||
                            conds.requiresUserSegment?.excludeUserIds
                          ? { ...conds.requiresUserSegment, excludePhoneNumbers: undefined }
                          : undefined,
                    })
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Score Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('leaderboardScore')}
        >
          <div className="flex items-center gap-2">
            {expandedSections.leaderboardScore ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">Leaderboard Score</span>
          </div>
          {conds.requiresLeaderboardScore && (
            <span className="text-xs text-muted-foreground">Configured</span>
          )}
        </button>
        {expandedSections.leaderboardScore && (
          <div className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Filter by user's current leaderboard score
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scoreOp">Operator</Label>
                <Select
                  value={conds.requiresLeaderboardScore?.op || 'gte'}
                  onValueChange={(value: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte') => {
                    updateConditions({
                      requiresLeaderboardScore: {
                        op: value,
                        value: conds.requiresLeaderboardScore?.value ?? 0,
                      },
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eq">Equal (=)</SelectItem>
                    <SelectItem value="ne">Not Equal (≠)</SelectItem>
                    <SelectItem value="gt">Greater Than (&gt;)</SelectItem>
                    <SelectItem value="gte">Greater Than or Equal (≥)</SelectItem>
                    <SelectItem value="lt">Less Than (&lt;)</SelectItem>
                    <SelectItem value="lte">Less Than or Equal (≤)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scoreValue">Score Value</Label>
                <Input
                  id="scoreValue"
                  type="number"
                  placeholder="0"
                  value={conds.requiresLeaderboardScore?.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    updateConditions({
                      requiresLeaderboardScore: value
                        ? {
                            op: conds.requiresLeaderboardScore?.op || 'gte',
                            value: parseInt(value),
                          }
                        : undefined,
                    })
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Example: Reward only for users with score &lt; 6 points
            </p>
          </div>
        )}
      </div>

      {/* Advanced Note */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          <strong>Advanced conditions:</strong> For complex conditions like user attributes and
          client input filters (which support nested AND/OR logic), use the Advanced tab to edit the
          conditions JSON directly.
        </p>
      </div>
    </div>
  )
}
