import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ConditionBuilder } from '@/components/common/ConditionBuilder'
import { useRewardsByGame } from '@/hooks/useRewards'
import type { RequiresRewardsCondition, RewardConditions } from '@/schemas/reward.schema'
import type { Conditions } from '@/types/conditions'
import { ChevronDown, ChevronRight, ChevronsUpDown, X } from 'lucide-react'
import { useState } from 'react'
import dayjs from 'dayjs'

interface ConditionsTabProps {
  conditions: string
  onChange: (conditions: string) => void
  gameId: string
}

// Type for expandable sections - matches condition keys + popover states
interface ExpandedSections {
  requiresRewards: boolean
  requiresRewardsPopover: boolean
  excludeRewardsPopover: boolean
  uniqueness: boolean
  timeWindow: boolean
  userSegment: boolean
  leaderboardScore: boolean
  userAttributes: boolean
  clientInput: boolean
}

const defaultExpandedSections: ExpandedSections = {
  requiresRewards: false,
  requiresRewardsPopover: false,
  excludeRewardsPopover: false,
  uniqueness: false,
  timeWindow: false,
  userSegment: false,
  leaderboardScore: false,
  userAttributes: false,
  clientInput: false,
}

// Helper to check if conditions are configured (used for initial expand & badges)
function getConfiguredSections(conds: RewardConditions) {
  const rr = !Array.isArray(conds.requiresRewards) ? conds.requiresRewards : undefined
  return {
    requiresRewards: !!(rr?.rewardIds?.length || rr?.excludeRewards?.length),
    uniqueness: !!conds.uniqueness?.maxPerUser,
    timeWindow: !!(
      conds.timeWindow?.startDate ||
      conds.timeWindow?.endDate ||
      conds.timeWindow?.daysOfWeek?.length ||
      conds.timeWindow?.hours
    ),
    userSegment: !!(
      conds.requiresUserSegment?.userIds?.length ||
      conds.requiresUserSegment?.phoneNumbers?.length ||
      conds.requiresUserSegment?.excludeUserIds?.length ||
      conds.requiresUserSegment?.excludePhoneNumbers?.length
    ),
    leaderboardScore: !!(
      conds.requiresLeaderboardScore?.op &&
      conds.requiresLeaderboardScore?.value !== undefined
    ),
    userAttributes: !!conds.requiresUserAttributes,
    clientInput: !!conds.requiresClientInput,
  }
}

export function ConditionsTab({ conditions, onChange, gameId }: ConditionsTabProps) {
  const { data: rewards = [] } = useRewardsByGame(gameId)

  // Parse initial conditions to determine which sections should be expanded
  const getInitialExpandedSections = (): ExpandedSections => {
    try {
      const conds: RewardConditions = conditions ? JSON.parse(conditions) : {}
      const configured = getConfiguredSections(conds)
      return {
        ...defaultExpandedSections,
        ...configured,
      }
    } catch {
      return defaultExpandedSections
    }
  }

  const [expandedSections, setExpandedSections] = useState<ExpandedSections>(getInitialExpandedSections)

  const toggleSection = (section: keyof ExpandedSections) => {
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

  // Get configured sections for "Configured" badges
  const configuredSections = getConfiguredSections(conds)

  // Helper to check if user segment has other fields with values (excluding specified field)
  const hasOtherUserSegmentFields = (exclude: 'userIds' | 'phoneNumbers' | 'excludeUserIds' | 'excludePhoneNumbers') => {
    const seg = conds.requiresUserSegment
    return !!(
      (exclude !== 'userIds' && seg?.userIds?.length) ||
      (exclude !== 'phoneNumbers' && seg?.phoneNumbers?.length) ||
      (exclude !== 'excludeUserIds' && seg?.excludeUserIds?.length) ||
      (exclude !== 'excludePhoneNumbers' && seg?.excludePhoneNumbers?.length)
    )
  }

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
          {configuredSections.requiresRewards && (
            <span className="text-xs text-muted-foreground">Configured</span>
          )}
        </button>
        {expandedSections.requiresRewards && (
          <div className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Require user to own specific rewards before unlocking this reward
            </p>
            <div className="space-y-2">
              <Label>Required Rewards</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Popover open={expandedSections.requiresRewardsPopover} onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, requiresRewardsPopover: open }))}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {(() => {
                          const currentCondition = !Array.isArray(conds.requiresRewards)
                            ? conds.requiresRewards
                            : undefined
                          const count = currentCondition?.rewardIds?.length || 0
                          return (
                            <>
                              <span>
                                {count > 0 ? `${count} reward${count > 1 ? 's' : ''} selected` : 'Select rewards...'}
                              </span>
                              {count === 0 && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                            </>
                          )
                        })()}
                      </Button>
                    </PopoverTrigger>
                  <PopoverContent className="w-100 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search rewards..." />
                      <div onWheel={(e) => e.stopPropagation()}>
                        <CommandList>
                          <CommandEmpty>No rewards found</CommandEmpty>
                          <CommandGroup>
                            {rewards.map((reward) => {
                              const currentCondition = !Array.isArray(conds.requiresRewards)
                                ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                                : undefined
                              const currentRewardIds = currentCondition?.rewardIds || []
                              const isSelected = currentRewardIds.includes(reward.rewardId)

                              return (
                                <CommandItem
                                  key={reward.rewardId}
                                  value={reward.name}
                                  onSelect={() => {
                                    const newRewardIds = isSelected
                                      ? currentRewardIds.filter((id: string) => id !== reward.rewardId)
                                      : [...currentRewardIds, reward.rewardId]

                                    updateConditions({
                                      requiresRewards: newRewardIds.length > 0
                                        ? {
                                            ...currentCondition,
                                            rewardIds: newRewardIds,
                                            mode: currentCondition?.mode || 'all',
                                          }
                                        : undefined,
                                    })
                                  }}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    className="mr-2"
                                  />
                                  <span>{reward.name}</span>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
                {(() => {
                  const currentCondition = !Array.isArray(conds.requiresRewards)
                    ? conds.requiresRewards
                    : undefined
                  const hasRewards = (currentCondition?.rewardIds?.length || 0) > 0
                  return hasRewards && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        updateConditions({ requiresRewards: undefined })
                      }}
                    >
                      <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                    </button>
                  )
                })()}
              </div>
            </div>
            {(() => {
                const currentCondition = !Array.isArray(conds.requiresRewards)
                  ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                  : undefined
                const currentRewardIds = currentCondition?.rewardIds || []
                return currentRewardIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentRewardIds.map((rewardId: string) => {
                      const reward = rewards.find((r) => r.rewardId === rewardId)
                      return (
                        <Badge key={rewardId} variant="secondary" className="gap-1">
                          {reward?.name || rewardId}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto w-auto p-0! hover:bg-transparent"
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
              })()}
            </div>
            {/* Mode selector - inline style */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>User must have</span>
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
                    requiresRewards:
                      currentCondition?.rewardIds?.length || currentCondition?.excludeRewards?.length
                        ? { ...currentCondition, mode: value }
                        : undefined,
                  })
                }}
              >
                <SelectTrigger className="w-auto h-7 text-sm text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  <SelectItem value="any">at least</SelectItem>
                </SelectContent>
              </Select>
              {(() => {
                const currentCondition = !Array.isArray(conds.requiresRewards)
                  ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                  : undefined
                return currentCondition?.mode === 'any' ? (
                  <Input
                    type="number"
                    min={1}
                    className="w-16 text-sm"
                    placeholder="1"
                    value={currentCondition?.count ?? ''}
                    onChange={(e) => {
                      const value = e.target.value
                      updateConditions({
                        requiresRewards:
                          currentCondition?.rewardIds?.length ||
                          currentCondition?.excludeRewards?.length
                            ? {
                                ...currentCondition,
                                count: value ? parseInt(value) : undefined,
                              }
                            : undefined,
                      })
                    }}
                  />
                ) : null
              })()}
              <span>of selected rewards</span>
            </div>
            <Separator className="my-2" />
            {/* Excluded Rewards */}
            <div className="space-y-2">
              <Label>Excluded Rewards (must NOT have)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Popover
                    open={expandedSections.excludeRewardsPopover}
                    onOpenChange={(open) =>
                      setExpandedSections((prev) => ({ ...prev, excludeRewardsPopover: open }))
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {(() => {
                        const currentCondition = !Array.isArray(conds.requiresRewards)
                          ? conds.requiresRewards
                          : undefined
                        const count = currentCondition?.excludeRewards?.length || 0
                        return (
                          <>
                            <span>
                              {count > 0
                                ? `${count} reward${count > 1 ? 's' : ''} excluded`
                                : 'Select rewards to exclude...'}
                            </span>
                            {count === 0 && (
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            )}
                          </>
                        )
                      })()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-100 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search rewards..." />
                      <div onWheel={(e) => e.stopPropagation()}>
                        <CommandList>
                          <CommandEmpty>No rewards found</CommandEmpty>
                          <CommandGroup>
                            {rewards.map((reward) => {
                              const currentCondition = !Array.isArray(conds.requiresRewards)
                                ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                                : undefined
                              const excludeRewards = currentCondition?.excludeRewards || []
                              const isExcluded = excludeRewards.includes(reward.rewardId)

                              return (
                                <CommandItem
                                  key={reward.rewardId}
                                  value={reward.name}
                                  onSelect={() => {
                                    const newExcludeRewards = isExcluded
                                      ? excludeRewards.filter((id: string) => id !== reward.rewardId)
                                      : [...excludeRewards, reward.rewardId]

                                    updateConditions({
                                      requiresRewards:
                                        newExcludeRewards.length > 0 ||
                                        currentCondition?.rewardIds?.length
                                          ? {
                                              ...currentCondition,
                                              excludeRewards:
                                                newExcludeRewards.length > 0
                                                  ? newExcludeRewards
                                                  : undefined,
                                            }
                                          : undefined,
                                    })
                                  }}
                                >
                                  <Checkbox checked={isExcluded} className="mr-2" />
                                  <span>{reward.name}</span>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
                {(() => {
                  const currentCondition = !Array.isArray(conds.requiresRewards)
                    ? conds.requiresRewards
                    : undefined
                  const hasExcluded = (currentCondition?.excludeRewards?.length || 0) > 0
                  return (
                    hasExcluded && (
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const current = !Array.isArray(conds.requiresRewards)
                            ? conds.requiresRewards
                            : undefined
                          updateConditions({
                            requiresRewards: current?.rewardIds?.length
                              ? { ...current, excludeRewards: undefined }
                              : undefined,
                          })
                        }}
                      >
                        <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                      </button>
                    )
                  )
                })()}
                </div>
              </div>
              {/* Excluded rewards badges */}
              {(() => {
                const currentCondition = !Array.isArray(conds.requiresRewards)
                  ? (conds.requiresRewards as RequiresRewardsCondition | undefined)
                  : undefined
                const excludeRewards = currentCondition?.excludeRewards || []
                return (
                  excludeRewards.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {excludeRewards.map((rewardId: string) => {
                        const reward = rewards.find((r) => r.rewardId === rewardId)
                        return (
                          <Badge key={rewardId} variant="destructive" className="gap-1">
                            {reward?.name || rewardId}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto w-auto p-0! hover:bg-transparent"
                              onClick={() => {
                                const newExcludeRewards = excludeRewards.filter(
                                  (id: string) => id !== rewardId
                                )
                                updateConditions({
                                  requiresRewards:
                                    newExcludeRewards.length > 0 || currentCondition?.rewardIds?.length
                                      ? {
                                          ...currentCondition,
                                          excludeRewards:
                                            newExcludeRewards.length > 0 ? newExcludeRewards : undefined,
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
            <p className="text-xs text-muted-foreground">
              Example: Unlock special reward #9 only after collecting 5 out of 8 mascots, but NOT if
              user already has the grand prize
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
          {configuredSections.uniqueness && <span className="text-xs text-muted-foreground">Configured</span>}
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

      {/* User Attributes Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('userAttributes')}
        >
          <div className="flex items-center gap-2">
            {expandedSections.userAttributes ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">User Attributes</span>
          </div>
          {configuredSections.userAttributes && (
            <span className="text-xs text-muted-foreground">Configured</span>
          )}
        </button>
        {expandedSections.userAttributes && (
          <div className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Filter by user profile attributes with complex AND/OR logic
            </p>
            <ConditionBuilder
              value={conds.requiresUserAttributes as Conditions}
              onChange={(value) => updateConditions({ requiresUserAttributes: value })}
            />
          </div>
        )}
      </div>

      {/* Client Input Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('clientInput')}
        >
          <div className="flex items-center gap-2">
            {expandedSections.clientInput ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">Client Input Filters</span>
          </div>
          {configuredSections.clientInput && (
            <span className="text-xs text-muted-foreground">Configured</span>
          )}
        </button>
        {expandedSections.clientInput && (
          <div className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Filter by data sent from client with complex AND/OR logic
            </p>
            <ConditionBuilder
              value={conds.requiresClientInput as Conditions}
              onChange={(value) => updateConditions({ requiresClientInput: value })}
            />
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
          {configuredSections.timeWindow && <span className="text-xs text-muted-foreground">Configured</span>}
        </button>
        {expandedSections.timeWindow && (
          <div className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Unlock this reward only during specific time windows
            </p>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <DateRangePicker
                value={{
                  from: conds.timeWindow?.startDate ? dayjs(conds.timeWindow.startDate).toDate() : undefined,
                  to: conds.timeWindow?.endDate ? dayjs(conds.timeWindow.endDate).toDate() : undefined,
                }}
                onChange={(range) =>
                  updateConditions({
                    timeWindow: {
                      ...conds.timeWindow,
                      startDate: range?.from ? dayjs(range.from).toISOString() : undefined,
                      endDate: range?.to ? dayjs(range.to).toISOString() : undefined,
                    },
                  })
                }
                placeholder="Select date range"
              />
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
          {configuredSections.userSegment && (
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
                      requiresUserSegment: userIds?.length
                        ? { ...conds.requiresUserSegment, userIds }
                        : hasOtherUserSegmentFields('userIds')
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
                      requiresUserSegment: phoneNumbers?.length
                        ? { ...conds.requiresUserSegment, phoneNumbers }
                        : hasOtherUserSegmentFields('phoneNumbers')
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
                      requiresUserSegment: excludeUserIds?.length
                        ? { ...conds.requiresUserSegment, excludeUserIds }
                        : hasOtherUserSegmentFields('excludeUserIds')
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
                      requiresUserSegment: excludePhoneNumbers?.length
                        ? { ...conds.requiresUserSegment, excludePhoneNumbers }
                        : hasOtherUserSegmentFields('excludePhoneNumbers')
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
          {configuredSections.leaderboardScore && (
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
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Pro tip:</strong> You can use the Visual Builder above for User Attributes and
          Client Input conditions, or edit them directly in the Advanced tab for fine-grained
          control.
        </p>
      </div>
    </div>
  )
}
