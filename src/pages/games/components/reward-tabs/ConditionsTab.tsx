import { ConditionBuilder } from '@/components/common/ConditionBuilder'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useRewardsByGame } from '@/hooks/queries'
import type {
  PeriodQuotaConfig,
  QuotaPeriod,
  RewardConditions,
} from '@/schemas/reward.schema'
import type { Conditions } from '@/types/conditions'
import dayjs from 'dayjs'
import { ChevronDown, ChevronRight, ChevronsUpDown, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

interface ConditionsTabProps {
  conditions: string
  onChange: (conditions: string) => void
  gameId: string
}

interface ConditionSectionProps {
  id: string
  label: string
  enabled: boolean
  expanded: boolean
  onToggleEnabled: (checked: boolean) => void
  onToggleExpanded: () => void
  children: ReactNode
}

// Reusable section wrapper with checkbox enable/disable + collapse/expand
function ConditionSection({
  id,
  label,
  enabled,
  expanded,
  onToggleEnabled,
  onToggleExpanded,
  children,
}: ConditionSectionProps) {
  return (
    <div className="border rounded-lg">
      <div
        className={`flex items-center justify-between p-4${enabled ? ' cursor-pointer' : ''}`}
        onClick={(e) => {
          if (!enabled) return
          const target = e.target as HTMLElement
          if (target.closest('button[role="checkbox"]') || target.closest('label')) return
          onToggleExpanded()
        }}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            id={id}
            checked={enabled}
            onCheckedChange={(checked) => onToggleEnabled(!!checked)}
          />
          <Label htmlFor={id} className="font-medium text-[16px] cursor-pointer">
            {label}
          </Label>
        </div>
        {enabled && (
          <div className="p-1">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        )}
      </div>
      {enabled && expanded && <div className="p-4 pt-0 space-y-4">{children}</div>}
    </div>
  )
}

// Type for expandable sections - matches condition keys + popover states
interface ExpandedSections {
  requiresRewards: boolean
  requiresRewardsPopover: boolean
  excludeRewardsPopover: boolean
  uniqueness: boolean
  quotaPerPeriod: boolean
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
  quotaPerPeriod: false,
  timeWindow: false,
  userSegment: false,
  leaderboardScore: false,
  userAttributes: false,
  clientInput: false,
}

// Helper to check if conditions are configured (used for initial expand)
function getConfiguredSections(conds: RewardConditions) {
  const rr = !Array.isArray(conds.requiresRewards) ? conds.requiresRewards : undefined
  return {
    requiresRewards: !!rr,
    uniqueness: !!conds.uniqueness,
    quotaPerPeriod: !!conds.quotaPerPeriod,
    timeWindow: !!conds.timeWindow,
    userSegment: !!conds.requiresUserSegment,
    leaderboardScore: !!conds.requiresLeaderboardScore,
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

  const [expandedSections, setExpandedSections] = useState<ExpandedSections>(
    getInitialExpandedSections
  )

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
    onChange(Object.keys(updated).length > 0 ? JSON.stringify(updated, null, 2) : '')
  }

  const conds = getConditions()

  // Condition shorthand variables
  const collectionReqs = !Array.isArray(conds.requiresRewards)
    ? conds.requiresRewards
    : undefined
  const uniqueness = conds.uniqueness
  const quota = conds.quotaPerPeriod
  const timeWindow = conds.timeWindow
  const userSegment = conds.requiresUserSegment
  const leaderboardScore = conds.requiresLeaderboardScore
  const userAttrs = conds.requiresUserAttributes
  const clientInput = conds.requiresClientInput

  // Quota per period helpers
  const updateQuota = (
    patch: Partial<{ max: number; period: QuotaPeriod; groupBy: string | undefined }>
  ) => {
    const updated = {
      max: quota?.max as number,
      period: quota?.period || 'day',
      groupBy: quota?.groupBy,
      ...patch,
    } as PeriodQuotaConfig
    updateConditions({ quotaPerPeriod: updated })
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Define conditions that must be met before a reward can be allocated. Leave empty for no
        restrictions.
      </div>

      {/* Collection Requirements Section */}
      <ConditionSection
        id="collectionReqsEnabled"
        label="Collection Requirements"
        enabled={!!collectionReqs}
        expanded={expandedSections.requiresRewards}
        onToggleEnabled={(checked) => {
          if (checked) {
            updateConditions({ requiresRewards: { mode: 'all' } })
            setExpandedSections((prev) => ({ ...prev, requiresRewards: true }))
          } else {
            updateConditions({ requiresRewards: undefined })
          }
        }}
        onToggleExpanded={() => toggleSection('requiresRewards')}
      >
        <p className="text-sm text-muted-foreground">
          Require user to own specific rewards before unlocking this reward
        </p>
        <div className="space-y-2">
          <Label>Required Rewards</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Popover
                open={expandedSections.requiresRewardsPopover}
                onOpenChange={(open) =>
                  setExpandedSections((prev) => ({ ...prev, requiresRewardsPopover: open }))
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {(() => {
                      const count = collectionReqs?.rewardIds?.length || 0
                      return (
                        <>
                          <span>
                            {count > 0
                              ? `${count} reward${count > 1 ? 's' : ''} selected`
                              : 'Select rewards...'}
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
                            const currentRewardIds = collectionReqs?.rewardIds || []
                            const isSelected = currentRewardIds.includes(reward.rewardId)

                            return (
                              <CommandItem
                                key={reward.rewardId}
                                value={reward.name}
                                onSelect={() => {
                                  const newRewardIds = isSelected
                                    ? currentRewardIds.filter(
                                        (id: string) => id !== reward.rewardId
                                      )
                                    : [...currentRewardIds, reward.rewardId]

                                  updateConditions({
                                    requiresRewards: {
                                      ...collectionReqs,
                                      rewardIds: newRewardIds.length > 0 ? newRewardIds : undefined,
                                      mode: collectionReqs?.mode || 'all',
                                    },
                                  })
                                }}
                              >
                                <Checkbox checked={isSelected} className="mr-2" />
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
              {(collectionReqs?.rewardIds?.length || 0) > 0 && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    updateConditions({
                      requiresRewards: { ...collectionReqs, rewardIds: undefined },
                    })
                  }}
                >
                  <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                </button>
              )}
            </div>
          </div>
          {(collectionReqs?.rewardIds?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {collectionReqs!.rewardIds!.map((rewardId: string) => {
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
                        const newRewardIds = collectionReqs!.rewardIds!.filter(
                          (id: string) => id !== rewardId
                        )
                        updateConditions({
                          requiresRewards: {
                            ...collectionReqs,
                            rewardIds: newRewardIds.length > 0 ? newRewardIds : undefined,
                          },
                        })
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
        {/* Mode selector - inline style */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>User must have</span>
          <Select
            value={collectionReqs?.mode || 'all'}
            onValueChange={(value: 'all' | 'any') => {
              updateConditions({
                requiresRewards: { ...collectionReqs, mode: value },
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
          {collectionReqs?.mode === 'any' && (
            <Input
              type="number"
              min={1}
              className="w-16 text-sm"
              placeholder="1"
              value={collectionReqs?.count ?? ''}
              onChange={(e) => {
                const value = e.target.value
                updateConditions({
                  requiresRewards: {
                    ...collectionReqs,
                    count: value ? parseInt(value) : undefined,
                  },
                })
              }}
            />
          )}
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
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {(() => {
                      const count = collectionReqs?.excludeRewards?.length || 0
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
                            const excludeRewards = collectionReqs?.excludeRewards || []
                            const isExcluded = excludeRewards.includes(reward.rewardId)

                            return (
                              <CommandItem
                                key={reward.rewardId}
                                value={reward.name}
                                onSelect={() => {
                                  const newExcludeRewards = isExcluded
                                    ? excludeRewards.filter(
                                        (id: string) => id !== reward.rewardId
                                      )
                                    : [...excludeRewards, reward.rewardId]

                                  updateConditions({
                                    requiresRewards: {
                                      ...collectionReqs,
                                      excludeRewards:
                                        newExcludeRewards.length > 0
                                          ? newExcludeRewards
                                          : undefined,
                                    },
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
              {(collectionReqs?.excludeRewards?.length || 0) > 0 && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    updateConditions({
                      requiresRewards: { ...collectionReqs, excludeRewards: undefined },
                    })
                  }}
                >
                  <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                </button>
              )}
            </div>
          </div>
          {/* Excluded rewards badges */}
          {(collectionReqs?.excludeRewards?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {collectionReqs!.excludeRewards!.map((rewardId: string) => {
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
                        const newExcludeRewards = collectionReqs!.excludeRewards!.filter(
                          (id: string) => id !== rewardId
                        )
                        updateConditions({
                          requiresRewards: {
                            ...collectionReqs,
                            excludeRewards:
                              newExcludeRewards.length > 0 ? newExcludeRewards : undefined,
                          },
                        })
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Example: Unlock special reward #9 only after collecting 5 out of 8 mascots, but NOT if
          user already has the grand prize
        </p>
      </ConditionSection>

      {/* Uniqueness Section */}
      <ConditionSection
        id="uniquenessEnabled"
        label="Duplicate Prevention"
        enabled={!!uniqueness}
        expanded={expandedSections.uniqueness}
        onToggleEnabled={(checked) => {
          if (checked) {
            updateConditions({ uniqueness: { maxPerUser: 1 } })
            setExpandedSections((prev) => ({ ...prev, uniqueness: true }))
          } else {
            updateConditions({ uniqueness: undefined })
          }
        }}
        onToggleExpanded={() => toggleSection('uniqueness')}
      >
        <p className="text-sm text-muted-foreground">
          Control how many times a user can receive this reward
        </p>
        <div className="space-y-2">
          <Label htmlFor="maxPerUser">Max Per User</Label>
          <Input
            id="maxPerUser"
            type="number"
            min={1}
            placeholder="1"
            value={uniqueness?.maxPerUser ?? ''}
            onChange={(e) =>
              updateConditions({
                uniqueness: {
                  maxPerUser: e.target.value
                    ? parseInt(e.target.value)
                    : (undefined as unknown as number),
                },
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Set to 1 for limited edition rewards.
          </p>
        </div>
      </ConditionSection>

      {/* Quota Per Period Section */}
      <ConditionSection
        id="quotaPerPeriodEnabled"
        label="Quota Per Period"
        enabled={!!quota}
        expanded={expandedSections.quotaPerPeriod}
        onToggleEnabled={(checked) => {
          if (checked) {
            updateConditions({ quotaPerPeriod: { max: 1, period: 'day' } })
            setExpandedSections((prev) => ({ ...prev, quotaPerPeriod: true }))
          } else {
            updateConditions({ quotaPerPeriod: undefined })
          }
        }}
        onToggleExpanded={() => toggleSection('quotaPerPeriod')}
      >
        <p className="text-sm text-muted-foreground">
          Limit how many rewards a user can receive within a time period
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Max</span>
          <Input
            type="number"
            min={1}
            className="w-20 text-sm text-foreground"
            placeholder="1"
            value={quota?.max ?? ''}
            onChange={(e) => {
              const value = e.target.value
              updateQuota({ max: value ? parseInt(value) : (undefined as unknown as number) })
            }}
          />
          <span>allocations per</span>
          <Select
            value={quota?.period || 'day'}
            onValueChange={(value: QuotaPeriod) => updateQuota({ period: value })}
          >
            <SelectTrigger className="w-28 text-sm text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          <span>per</span>
          <Select
            value={quota?.groupBy || 'per-reward'}
            onValueChange={(value) =>
              updateQuota({ groupBy: value === 'per-reward' ? undefined : value })
            }
          >
            <SelectTrigger className="w-auto h-8 text-sm text-foreground gap-1 px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per-reward">This Reward</SelectItem>
              <SelectItem value="rewardType">Reward Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          When grouped by Reward Type, the quota counts all rewards sharing the same type (e.g.,
          voucher, coins). Leave as "This Reward" to count only this specific reward.
        </p>
      </ConditionSection>

      {/* User Attributes Section */}
      <ConditionSection
        id="userAttrsEnabled"
        label="User Attributes"
        enabled={!!userAttrs}
        expanded={expandedSections.userAttributes}
        onToggleEnabled={(checked) => {
          if (checked) {
            updateConditions({ requiresUserAttributes: { mode: 'AND', conditions: [] } })
            setExpandedSections((prev) => ({ ...prev, userAttributes: true }))
          } else {
            updateConditions({ requiresUserAttributes: undefined })
          }
        }}
        onToggleExpanded={() => toggleSection('userAttributes')}
      >
        <p className="text-sm text-muted-foreground">
          Filter by user profile attributes with complex AND/OR logic
        </p>
        <ConditionBuilder
          value={userAttrs as Conditions}
          onChange={(value) => updateConditions({ requiresUserAttributes: value })}
        />
      </ConditionSection>

      {/* Client Input Section */}
      <ConditionSection
        id="clientInputEnabled"
        label="Client Input Filters"
        enabled={!!clientInput}
        expanded={expandedSections.clientInput}
        onToggleEnabled={(checked) => {
          if (checked) {
            updateConditions({ requiresClientInput: { mode: 'AND', conditions: [] } })
            setExpandedSections((prev) => ({ ...prev, clientInput: true }))
          } else {
            updateConditions({ requiresClientInput: undefined })
          }
        }}
        onToggleExpanded={() => toggleSection('clientInput')}
      >
        <p className="text-sm text-muted-foreground">
          Filter by data sent from client with complex AND/OR logic
        </p>
        <ConditionBuilder
          value={clientInput as Conditions}
          onChange={(value) => updateConditions({ requiresClientInput: value })}
        />
      </ConditionSection>

      {/* Time Window Section */}
      <ConditionSection
        id="timeWindowEnabled"
        label="Time Window"
        enabled={!!timeWindow}
        expanded={expandedSections.timeWindow}
        onToggleEnabled={(checked) => {
          if (checked) {
            updateConditions({ timeWindow: {} })
            setExpandedSections((prev) => ({ ...prev, timeWindow: true }))
          } else {
            updateConditions({ timeWindow: undefined })
          }
        }}
        onToggleExpanded={() => toggleSection('timeWindow')}
      >
        <p className="text-sm text-muted-foreground">
          Unlock this reward only during specific time windows
        </p>
        <div className="space-y-2">
          <Label>Date Range</Label>
          <DateRangePicker
            value={{
              from: timeWindow?.startDate ? dayjs(timeWindow.startDate).toDate() : undefined,
              to: timeWindow?.endDate ? dayjs(timeWindow.endDate).toDate() : undefined,
            }}
            onChange={(range) =>
              updateConditions({
                timeWindow: {
                  ...timeWindow,
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
                value={timeWindow?.hours?.[0] ?? ''}
                onChange={(e) =>
                  updateConditions({
                    timeWindow: {
                      ...timeWindow,
                      hours: [parseInt(e.target.value) || 0, timeWindow?.hours?.[1] ?? 23],
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
                value={timeWindow?.hours?.[1] ?? ''}
                onChange={(e) =>
                  updateConditions({
                    timeWindow: {
                      ...timeWindow,
                      hours: [timeWindow?.hours?.[0] ?? 0, parseInt(e.target.value) || 23],
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
                    checked={timeWindow?.daysOfWeek?.includes(index) ?? false}
                    onCheckedChange={(checked) => {
                      const current = timeWindow?.daysOfWeek ?? []
                      const updated = checked
                        ? [...current, index].sort()
                        : current.filter((d: number) => d !== index)
                      updateConditions({
                        timeWindow: {
                          ...timeWindow,
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
      </ConditionSection>

      {/* User Segment Section */}
      <ConditionSection
        id="userSegmentEnabled"
        label="User Segment"
        enabled={!!userSegment}
        expanded={expandedSections.userSegment}
        onToggleEnabled={(checked) => {
          if (checked) {
            updateConditions({ requiresUserSegment: {} })
            setExpandedSections((prev) => ({ ...prev, userSegment: true }))
          } else {
            updateConditions({ requiresUserSegment: undefined })
          }
        }}
        onToggleExpanded={() => toggleSection('userSegment')}
      >
        <p className="text-sm text-muted-foreground">
          Target specific users by ID or phone number
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userIds">Whitelist User IDs (comma-separated)</Label>
            <Input
              id="userIds"
              placeholder="user-123, user-456"
              value={userSegment?.userIds?.join(', ') ?? ''}
              onChange={(e) => {
                const value = e.target.value
                const userIds = value
                  ? value
                      .split(',')
                      .map((id) => id.trim())
                      .filter(Boolean)
                  : undefined
                updateConditions({
                  requiresUserSegment: {
                    ...userSegment,
                    userIds: userIds?.length ? userIds : undefined,
                  },
                })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumbers">Whitelist Phone Numbers (comma-separated)</Label>
            <Input
              id="phoneNumbers"
              placeholder="0901234567, 0912345678"
              value={userSegment?.phoneNumbers?.join(', ') ?? ''}
              onChange={(e) => {
                const value = e.target.value
                const phoneNumbers = value
                  ? value
                      .split(',')
                      .map((phone) => phone.trim())
                      .filter(Boolean)
                  : undefined
                updateConditions({
                  requiresUserSegment: {
                    ...userSegment,
                    phoneNumbers: phoneNumbers?.length ? phoneNumbers : undefined,
                  },
                })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excludeUserIds">Blacklist User IDs (comma-separated)</Label>
            <Input
              id="excludeUserIds"
              placeholder="user-789, user-012"
              value={userSegment?.excludeUserIds?.join(', ') ?? ''}
              onChange={(e) => {
                const value = e.target.value
                const excludeUserIds = value
                  ? value
                      .split(',')
                      .map((id) => id.trim())
                      .filter(Boolean)
                  : undefined
                updateConditions({
                  requiresUserSegment: {
                    ...userSegment,
                    excludeUserIds: excludeUserIds?.length ? excludeUserIds : undefined,
                  },
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
              placeholder="0923456789"
              value={userSegment?.excludePhoneNumbers?.join(', ') ?? ''}
              onChange={(e) => {
                const value = e.target.value
                const excludePhoneNumbers = value
                  ? value
                      .split(',')
                      .map((phone) => phone.trim())
                      .filter(Boolean)
                  : undefined
                updateConditions({
                  requiresUserSegment: {
                    ...userSegment,
                    excludePhoneNumbers: excludePhoneNumbers?.length
                      ? excludePhoneNumbers
                      : undefined,
                  },
                })
              }}
            />
          </div>
        </div>
      </ConditionSection>

      {/* Leaderboard Score Section */}
      <ConditionSection
        id="leaderboardScoreEnabled"
        label="Leaderboard Score"
        enabled={!!leaderboardScore}
        expanded={expandedSections.leaderboardScore}
        onToggleEnabled={(checked) => {
          if (checked) {
            updateConditions({ requiresLeaderboardScore: { op: 'gte', value: 0 } })
            setExpandedSections((prev) => ({ ...prev, leaderboardScore: true }))
          } else {
            updateConditions({ requiresLeaderboardScore: undefined })
          }
        }}
        onToggleExpanded={() => toggleSection('leaderboardScore')}
      >
        <p className="text-sm text-muted-foreground">
          Filter by user's current leaderboard score
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scoreOp">Operator</Label>
            <Select
              value={leaderboardScore?.op || 'gte'}
              onValueChange={(value: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte') => {
                updateConditions({
                  requiresLeaderboardScore: {
                    op: value,
                    value: leaderboardScore?.value ?? 0,
                  },
                })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eq">Equal (=)</SelectItem>
                <SelectItem value="ne">Not Equal (!=)</SelectItem>
                <SelectItem value="gt">Greater Than (&gt;)</SelectItem>
                <SelectItem value="gte">Greater Than or Equal (&gt;=)</SelectItem>
                <SelectItem value="lt">Less Than (&lt;)</SelectItem>
                <SelectItem value="lte">Less Than or Equal (&lt;=)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scoreValue">Score Value</Label>
            <Input
              id="scoreValue"
              type="number"
              placeholder="0"
              value={leaderboardScore?.value ?? ''}
              onChange={(e) => {
                const value = e.target.value
                updateConditions({
                  requiresLeaderboardScore: value
                    ? {
                        op: leaderboardScore?.op || 'gte',
                        value: parseInt(value),
                      }
                    : { op: leaderboardScore?.op || 'gte', value: 0 },
                })
              }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Example: Reward only for users with score &lt; 6 points
        </p>
      </ConditionSection>

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
