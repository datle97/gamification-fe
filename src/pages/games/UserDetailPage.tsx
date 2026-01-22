import { AnalyticsDisabledCard } from '@/components/common/AnalyticsDisabledCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  useCheckEligibility,
  useGame,
  useGameUserDetail,
  useGrantTurns,
  useResetAllMissionsProgress,
  useResetMissionProgress,
  useRevokeUserReward,
  useUpdateUserAttributes,
  useUserActivities,
  useUserMissions,
  useUserRewards,
  useUserTurns,
} from '@/hooks/queries'
import { useFormatDate } from '@/hooks/useFormatDate'
import type {
  ActivityType,
  ExpirationMode,
  ExpirationUnit,
  RewardEligibilityResult,
  UserActivity,
  UserReward,
} from '@/services/game-users.service'
import { useAnalytics, useDevMode } from '@/stores/settingsStore'
import dayjs from 'dayjs'
import parse from 'html-react-parser'
import {
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Coins,
  Gamepad2,
  Gift,
  History,
  Loader2,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Share2,
  Shield,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  UserCog,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

type TabValue = 'overview' | 'activity' | 'rewards' | 'missions'

// Format condition check to human-readable text
function formatConditionCheck(check: {
  name: string
  passed: boolean
  detail?: Record<string, unknown>
}): string {
  const { name, passed, detail } = check

  switch (name) {
    case 'requiresRewards': {
      const required = detail?.required as
        | { rewardIds?: string[]; count?: number; mode?: string }
        | undefined
      const owned = (detail?.owned as string[]) || []
      if (!required?.rewardIds?.length)
        return passed ? 'Has required rewards' : 'Missing required rewards'
      const mode = required.mode || 'all'
      const count = required.count || required.rewardIds.length
      if (mode === 'all') {
        return passed
          ? `Has all ${required.rewardIds.length} required rewards`
          : `Need all ${required.rewardIds.length} rewards, has ${owned.length}`
      }
      return passed
        ? `Has ${owned.length}/${count} required rewards`
        : `Need ${count} rewards, has ${owned.length}`
    }

    case 'uniqueness': {
      const maxPerUser = detail?.maxPerUser as number | undefined
      const ownedCount = (detail?.ownedCount as number) || 0
      if (maxPerUser === undefined || maxPerUser === null) return 'No limit'
      return passed
        ? `Limit ${maxPerUser}/user (has ${ownedCount})`
        : `Limit ${maxPerUser}/user, already has ${ownedCount}`
    }

    case 'userAttributes': {
      const required = detail?.required as
        | { field?: string; op?: string; value?: unknown }
        | undefined
      const actual = detail?.actual as Record<string, unknown> | undefined
      if (!required?.field) return passed ? 'Attributes OK' : 'Attributes not met'
      const actualValue = actual?.[required.field]
      const opText = formatOperator(required.op)
      return passed
        ? `${required.field} = ${actualValue ?? 0} (${opText} ${required.value})`
        : `Need ${required.field} ${opText} ${required.value}, has ${actualValue ?? 0}`
    }

    case 'clientInput': {
      const required = detail?.required as
        | { field?: string; op?: string; value?: unknown }
        | undefined
      const actual = detail?.actual as Record<string, unknown> | undefined
      if (!required?.field) return passed ? 'Input OK' : 'Input not provided'
      const actualValue = actual?.[required.field]
      const opText = formatOperator(required.op)
      return passed
        ? `${required.field} = ${actualValue}`
        : `Need ${required.field} ${opText} ${required.value}${actualValue !== undefined ? `, got ${actualValue}` : ''}`
    }

    case 'timeWindow': {
      const tw = detail as
        | { startDate?: string; endDate?: string; hours?: [number, number] }
        | undefined
      if (!tw) return passed ? 'Within time window' : 'Outside time window'
      if (tw.hours) {
        return passed
          ? `Active ${tw.hours[0]}:00-${tw.hours[1]}:00`
          : `Only active ${tw.hours[0]}:00-${tw.hours[1]}:00`
      }
      return passed ? 'Within time window' : 'Outside time window'
    }

    case 'userSegment': {
      return passed ? 'In target segment' : 'Not in target segment'
    }

    case 'leaderboardScore': {
      const required = detail?.required as { op?: string; value?: number } | undefined
      const actual = detail?.actual as number | undefined
      if (!required) return passed ? 'Score OK' : 'Score not met'
      const opText = formatOperator(required.op)
      return passed
        ? `Score = ${actual ?? 0} (${opText} ${required.value})`
        : `Need score ${opText} ${required.value}, has ${actual ?? 0}`
    }

    default:
      return name
  }
}

function formatOperator(op?: string): string {
  switch (op) {
    case 'eq':
      return '='
    case 'ne':
      return '≠'
    case 'gt':
      return '>'
    case 'gte':
      return '≥'
    case 'lt':
      return '<'
    case 'lte':
      return '≤'
    case 'in':
      return 'in'
    case 'not_in':
      return 'not in'
    default:
      return op || '='
  }
}

// Activity type labels and colors using theme variables
const ACTIVITY_CONFIG: Record<
  ActivityType,
  {
    label: string
    colorVar: string
    bgClass: string
    textClass: string
    borderClass: string
    badgeBgClass: string
  }
> = {
  game_play: {
    label: 'Game Plays',
    colorVar: 'chart-1',
    bgClass: 'bg-chart-1',
    textClass: 'text-chart-1',
    borderClass: 'border-chart-1',
    badgeBgClass: 'bg-chart-1/20',
  },
  game_share: {
    label: 'Game Shares',
    colorVar: 'chart-3',
    bgClass: 'bg-chart-3',
    textClass: 'text-chart-3',
    borderClass: 'border-chart-3',
    badgeBgClass: 'bg-chart-3/20',
  },
  turn_earn: {
    label: 'Turns Earned',
    colorVar: 'chart-2',
    bgClass: 'bg-chart-2',
    textClass: 'text-chart-2',
    borderClass: 'border-chart-2',
    badgeBgClass: 'bg-chart-2/20',
  },
  turn_spend: {
    label: 'Turns Spent',
    colorVar: 'primary',
    bgClass: 'bg-primary',
    textClass: 'text-primary',
    borderClass: 'border-primary',
    badgeBgClass: 'bg-primary/20',
  },
  turn_expire: {
    label: 'Turns Expired',
    colorVar: 'muted-foreground',
    bgClass: 'bg-muted-foreground',
    textClass: 'text-muted-foreground',
    borderClass: 'border-muted-foreground',
    badgeBgClass: 'bg-muted-foreground/20',
  },
  reward_earn: {
    label: 'Rewards Won',
    colorVar: 'chart-4',
    bgClass: 'bg-chart-4',
    textClass: 'text-chart-4',
    borderClass: 'border-chart-4',
    badgeBgClass: 'bg-chart-4/20',
  },
  mission_complete: {
    label: 'Missions',
    colorVar: 'chart-5',
    bgClass: 'bg-chart-5',
    textClass: 'text-chart-5',
    borderClass: 'border-chart-5',
    badgeBgClass: 'bg-chart-5/20',
  },
  score_earn: {
    label: 'Score Earned',
    colorVar: 'chart-1',
    bgClass: 'bg-chart-1',
    textClass: 'text-chart-1',
    borderClass: 'border-chart-1',
    badgeBgClass: 'bg-chart-1/20',
  },
  admin_grant: {
    label: 'Admin Grant',
    colorVar: 'chart-2',
    bgClass: 'bg-chart-2',
    textClass: 'text-chart-2',
    borderClass: 'border-chart-2',
    badgeBgClass: 'bg-chart-2/20',
  },
  admin_revoke: {
    label: 'Admin Revoke',
    colorVar: 'destructive',
    bgClass: 'bg-destructive',
    textClass: 'text-destructive',
    borderClass: 'border-destructive',
    badgeBgClass: 'bg-destructive/20',
  },
  reward_share: {
    label: 'Rewards Shared',
    colorVar: 'chart-3',
    bgClass: 'bg-chart-3',
    textClass: 'text-chart-3',
    borderClass: 'border-chart-3',
    badgeBgClass: 'bg-chart-3/20',
  },
  reward_claim: {
    label: 'Rewards Claimed',
    colorVar: 'chart-4',
    bgClass: 'bg-chart-4',
    textClass: 'text-chart-4',
    borderClass: 'border-chart-4',
    badgeBgClass: 'bg-chart-4/20',
  },
  reward_fail: {
    label: 'No Reward',
    colorVar: 'muted-foreground',
    bgClass: 'bg-muted-foreground',
    textClass: 'text-muted-foreground',
    borderClass: 'border-muted-foreground',
    badgeBgClass: 'bg-muted-foreground/20',
  },
  mission_progress: {
    label: 'Mission Progress',
    colorVar: 'chart-5',
    bgClass: 'bg-chart-5',
    textClass: 'text-chart-5',
    borderClass: 'border-chart-5',
    badgeBgClass: 'bg-chart-5/20',
  },
}

// Get icon for activity type
function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'game_play':
      return Gamepad2
    case 'game_share':
      return Share2
    case 'turn_earn':
      return Plus
    case 'turn_spend':
      return Coins
    case 'turn_expire':
      return Clock
    case 'reward_earn':
      return Gift
    case 'reward_share':
      return Share2
    case 'reward_claim':
      return PackageCheck
    case 'reward_fail':
      return Ban
    case 'mission_complete':
      return Trophy
    case 'mission_progress':
      return TrendingUp
    case 'score_earn':
      return Target
    case 'admin_grant':
      return Shield
    case 'admin_revoke':
      return Trash2
    default:
      return History
  }
}

// Activity group type for timeline
type ActivityGroup = {
  requestId: string
  timestamp: string
  activities: UserActivity[]
  primaryType: ActivityType
}

type DateGroup = {
  date: string
  label: string
  groups: ActivityGroup[]
}

// Reusable ActivityTimeline component
function ActivityTimeline({
  dateGroups,
  limit,
  showDateHeaders = true,
}: {
  dateGroups: DateGroup[]
  limit?: number
  showDateHeaders?: boolean
}) {
  // Flatten all groups if we need to limit
  const allGroups = dateGroups.flatMap((dg) => dg.groups)
  const limitedGroups = limit ? allGroups.slice(0, limit) : null

  // If limiting, we need to rebuild date groups with only the limited items
  const displayGroups = limitedGroups
    ? (() => {
        const result: DateGroup[] = []
        limitedGroups.forEach((group) => {
          const originalDateGroup = dateGroups.find((dg) =>
            dg.groups.some((g) => g.requestId === group.requestId)
          )
          if (!originalDateGroup) return

          const existing = result.find((r) => r.date === originalDateGroup.date)
          if (existing) {
            existing.groups.push(group)
          } else {
            result.push({
              date: originalDateGroup.date,
              label: originalDateGroup.label,
              groups: [group],
            })
          }
        })
        return result
      })()
    : dateGroups

  if (displayGroups.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No activity found</div>
  }

  return (
    <div className="space-y-6">
      {displayGroups.map((dateGroup) => (
        <div key={dateGroup.date}>
          {/* Date Header */}
          {showDateHeaders && (
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pl-14">
              {dateGroup.label}
            </div>
          )}
          {/* Activity groups for this date */}
          <div className="space-y-0">
            {dateGroup.groups.map((group) => {
              const isGrouped = group.activities.length > 1
              const primaryActivity = group.activities[0]
              const primaryConfig = ACTIVITY_CONFIG[group.primaryType]
              const PrimaryIcon = getActivityIcon(group.primaryType)
              const subActivities = group.activities.slice(1)

              // Extract rewards and scores for badges
              const rewards = subActivities.filter((a) => a.type === 'reward_earn')
              const scores = subActivities.filter((a) => a.type === 'score_earn')
              const missions = subActivities.filter((a) => a.type === 'mission_complete')

              return (
                <div key={group.requestId} className="flex gap-4 group">
                  {/* Time column */}
                  <div className="w-10 text-xs text-muted-foreground tabular-nums text-right pt-0.5 shrink-0">
                    {dayjs(group.timestamp).format('HH:mm')}
                  </div>

                  {/* Timeline dot */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${primaryConfig?.bgClass || 'bg-border'}`}
                    />
                    {/* Connector line to next item */}
                    <div className="w-px flex-1 bg-border mt-2" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    {/* Main action */}
                    <div className="flex items-start gap-2">
                      <PrimaryIcon
                        className={`h-4 w-4 mt-0.5 shrink-0 ${primaryConfig?.textClass || 'text-muted-foreground'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm">{primaryActivity.description}</span>
                        {primaryActivity.metadata?.source && (
                          <span className="ml-2 text-[10px] text-muted-foreground/70 font-medium uppercase">
                            {primaryActivity.metadata.source}
                          </span>
                        )}
                        {primaryActivity.metadata?.requestId && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="ml-2 text-[10px] text-muted-foreground/70 font-mono hover:text-foreground transition-colors"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    primaryActivity.metadata!.requestId!
                                  )
                                }}
                              >
                                #{primaryActivity.metadata.requestId.slice(-8)}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono text-xs">
                                {primaryActivity.metadata.requestId}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Sub-activities as inline badges */}
                    {isGrouped && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                        {rewards.map((r) => (
                          <span
                            key={r.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-foreground ${ACTIVITY_CONFIG.reward_earn.badgeBgClass}`}
                          >
                            <Gift className={`h-3 w-3 ${ACTIVITY_CONFIG.reward_earn.textClass}`} />
                            {r.metadata?.rewardName ||
                              r.description.replace('Won "', '').replace('"', '')}
                          </span>
                        ))}
                        {scores.map((s) => (
                          <span
                            key={s.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-foreground ${ACTIVITY_CONFIG.score_earn.badgeBgClass}`}
                          >
                            <Target className={`h-3 w-3 ${ACTIVITY_CONFIG.score_earn.textClass}`} />
                            +{s.metadata?.score || 1}
                          </span>
                        ))}
                        {missions.map((m) => (
                          <span
                            key={m.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-foreground ${ACTIVITY_CONFIG.mission_complete.badgeBgClass}`}
                          >
                            <Trophy
                              className={`h-3 w-3 ${ACTIVITY_CONFIG.mission_complete.textClass}`}
                            />
                            {m.metadata?.missionName || 'Mission'}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Show "No Reward" when turn was spent but no reward earned */}
                    {(group.primaryType === 'turn_spend' || group.primaryType === 'game_play') &&
                      rewards.length === 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-muted-foreground bg-muted">
                            <Gift className="h-3 w-3" />
                            No Reward
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function RewardItem({
  reward,
  gameId,
  userId,
  isDevMode,
  formatDate,
}: {
  reward: UserReward
  gameId: string
  userId: string
  isDevMode: boolean
  formatDate: (date: string) => string
}) {
  const revokeReward = useRevokeUserReward(gameId, userId)

  return (
    <div className="rounded-lg border p-3 group">
      <div className="flex items-start gap-3">
        {reward.reward?.imageUrl && (
          <img
            src={reward.reward.imageUrl}
            alt=""
            className="h-10 w-10 rounded object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{reward.reward?.name || 'Unknown Reward'}</div>
          {reward.rewardValue && (
            <div className="text-sm text-muted-foreground font-mono truncate">
              {reward.rewardValue}
            </div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">
            {formatDate(reward.createdAt)}
            {reward.expiredAt && <> • {formatDate(reward.expiredAt)}</>}
          </div>
        </div>
        {isDevMode && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => revokeReward.mutate(reward.id)}
            disabled={revokeReward.isPending}
            title="Revoke reward"
          >
            {revokeReward.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

export function UserDetailPage() {
  const { gameId, userId } = useParams<{ gameId: string; userId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { formatDate, formatDateTime } = useFormatDate()

  const currentTab = (searchParams.get('tab') as TabValue) || 'overview'

  const isDevMode = useDevMode()
  const showAnalytics = useAnalytics()

  // Data fetching
  const { data: game } = useGame(gameId!)
  const { data: userGame, isLoading } = useGameUserDetail(gameId!, userId!)
  const { data: turns } = useUserTurns(gameId!, userId!)
  const { data: rewards } = useUserRewards(gameId!, userId!)
  const { data: missions } = useUserMissions(gameId!, userId!)
  const { data: activitiesData } = useUserActivities(gameId!, userId!, 1, 200)

  // Admin actions
  const checkEligibility = useCheckEligibility(gameId!, userId!)
  const grantTurns = useGrantTurns(gameId!, userId!)
  const resetMission = useResetMissionProgress(gameId!, userId!)
  const resetAllMissions = useResetAllMissionsProgress(gameId!, userId!)
  const updateAttributes = useUpdateUserAttributes(gameId!, userId!)

  // Admin state
  const [grantTurnsOpen, setGrantTurnsOpen] = useState(false)
  const [grantAmount, setGrantAmount] = useState('1')
  const [grantReason, setGrantReason] = useState('')
  const [grantExpMode, setGrantExpMode] = useState<ExpirationMode>('permanent')
  const [grantExpValue, setGrantExpValue] = useState('7')
  const [grantExpUnit, setGrantExpUnit] = useState<ExpirationUnit>('day')
  const [showClientInput, setShowClientInput] = useState(false)
  const [clientInputJson, setClientInputJson] = useState('')
  const [eligibilityResults, setEligibilityResults] = useState<RewardEligibilityResult[] | null>(
    null
  )
  const [eligibilityOpen, setEligibilityOpen] = useState(false)
  const [attributesDialogOpen, setAttributesDialogOpen] = useState(false)
  const [editingAttributes, setEditingAttributes] = useState<{ key: string; value: string }[]>([])

  // Reset admin state when userId changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrantTurnsOpen(false)
    setGrantAmount('1')
    setGrantReason('')
    setGrantExpMode('permanent')
    setGrantExpValue('7')
    setGrantExpUnit('day')
    setEligibilityResults(null)
    setEligibilityOpen(false)
    setShowClientInput(false)
    setClientInputJson('')
    setAttributesDialogOpen(false)
    setEditingAttributes([])
  }, [userId])

  const handleGrantTurns = () => {
    const amount = parseInt(grantAmount, 10)
    if (isNaN(amount) || amount < 1) return

    const expirationConfig =
      grantExpMode === 'permanent'
        ? { mode: 'permanent' as const }
        : {
            mode: 'ttl' as const,
            value: parseInt(grantExpValue, 10) || 7,
            unit: grantExpUnit,
          }

    grantTurns.mutate(
      { amount, reason: grantReason || undefined, expirationConfig },
      {
        onSuccess: () => {
          setGrantTurnsOpen(false)
          setGrantAmount('1')
          setGrantReason('')
          setGrantExpMode('permanent')
          setGrantExpValue('7')
          setGrantExpUnit('day')
        },
      }
    )
  }

  const handleCheckEligibility = (withClientInput: boolean) => {
    if (withClientInput) {
      setShowClientInput(true)
      return
    }

    let clientInput: Record<string, unknown> | undefined
    if (clientInputJson.trim()) {
      try {
        clientInput = JSON.parse(clientInputJson)
      } catch {
        // Invalid JSON, ignore
      }
    }

    checkEligibility.mutate(clientInput ? { clientInput } : undefined, {
      onSuccess: (data) => {
        setEligibilityResults(data)
        setEligibilityOpen(true)
        setShowClientInput(false)
      },
    })
  }

  // Computed stats
  const totalTurns = useMemo(
    () => turns?.reduce((sum, t) => sum + t.remainingAmount, 0) || 0,
    [turns]
  )
  const completedMissions = useMemo(
    () => missions?.filter((m) => m.progress?.isCompleted).length || 0,
    [missions]
  )
  const totalPlays = useMemo(
    () => activitiesData?.activities.filter((a) => a.type === 'game_play').length || 0,
    [activitiesData]
  )
  const totalScore = useMemo(
    () =>
      activitiesData?.activities
        .filter((a) => a.type === 'score_earn')
        .reduce((sum, a) => sum + (a.metadata?.score || 0), 0) || 0,
    [activitiesData]
  )

  // Get chart colors from CSS variables - convert oklch to rgb for recharts compatibility
  const chartColors = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        chart1: '#6b7280',
        chart2: '#6b7280',
        chart3: '#6b7280',
        chart4: '#6b7280',
        chart5: '#6b7280',
        primary: '#6b7280',
        muted: '#6b7280',
        destructive: '#6b7280',
        foreground: '#1f2937',
        popover: '#ffffff',
        border: '#e5e7eb',
      }
    }
    // Create a temp element to compute actual color values
    const getColor = (varName: string) => {
      const el = document.createElement('div')
      el.style.color = `var(--${varName})`
      document.body.appendChild(el)
      const color = getComputedStyle(el).color
      document.body.removeChild(el)
      return color
    }
    return {
      chart1: getColor('chart-1'),
      chart2: getColor('chart-2'),
      chart3: getColor('chart-3'),
      chart4: getColor('chart-4'),
      chart5: getColor('chart-5'),
      primary: getColor('primary'),
      muted: getColor('muted-foreground'),
      destructive: getColor('destructive'),
      foreground: getColor('foreground'),
      popover: getColor('popover'),
      border: getColor('border'),
    }
  }, [])

  // Activity over time for line chart
  const activityOverTime = useMemo(() => {
    if (!activitiesData?.activities) return []

    const byDate: Record<string, { date: string; plays: number; rewards: number }> = {}

    activitiesData.activities.forEach((a) => {
      const date = new Date(a.timestamp).toISOString().split('T')[0]
      if (!byDate[date]) {
        byDate[date] = { date, plays: 0, rewards: 0 }
      }
      if (a.type === 'game_play') byDate[date].plays++
      if (a.type === 'reward_earn') byDate[date].rewards++
    })

    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14) // Last 14 days
  }, [activitiesData])

  // Group activities by requestId, then by date
  const groupedActivities = useMemo(() => {
    if (!activitiesData?.activities) return []

    const now = dayjs()

    // Group activities by requestId from metadata (or use id as fallback for standalone activities)
    const byRequestId = new Map<string, UserActivity[]>()

    activitiesData.activities.forEach((activity) => {
      const key = activity.metadata?.requestId || `single_${activity.id}`
      if (!byRequestId.has(key)) {
        byRequestId.set(key, [])
      }
      byRequestId.get(key)!.push(activity)
    })

    // Convert to array of activity groups
    const groups: {
      requestId: string
      timestamp: string
      activities: UserActivity[]
      primaryType: ActivityType
    }[] = []

    byRequestId.forEach((activities, requestId) => {
      // Sort activities within group by type priority
      const typePriority: Record<ActivityType, number> = {
        game_play: 1,
        game_share: 2,
        turn_spend: 3,
        reward_earn: 4,
        reward_share: 5,
        reward_claim: 6,
        reward_fail: 7,
        score_earn: 8,
        mission_complete: 9,
        mission_progress: 10,
        turn_earn: 11,
        turn_expire: 12,
        admin_grant: 13,
        admin_revoke: 14,
      }
      activities.sort((a, b) => typePriority[a.type] - typePriority[b.type])

      groups.push({
        requestId,
        timestamp: activities[0].timestamp,
        activities,
        primaryType: activities[0].type,
      })
    })

    // Sort groups by timestamp descending
    groups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Now group by date
    const byDate: { date: string; label: string; groups: typeof groups }[] = []

    groups.forEach((group) => {
      const activityDate = dayjs(group.timestamp)
      const dateKey = activityDate.format('YYYY-MM-DD')

      let dateLabel: string
      if (activityDate.isSame(now, 'day')) {
        dateLabel = 'Today'
      } else if (activityDate.isSame(now.subtract(1, 'day'), 'day')) {
        dateLabel = 'Yesterday'
      } else {
        dateLabel = activityDate.format('MMM D')
      }

      const existingGroup = byDate.find((g) => g.date === dateKey)
      if (existingGroup) {
        existingGroup.groups.push(group)
      } else {
        byDate.push({
          date: dateKey,
          label: dateLabel,
          groups: [group],
        })
      }
    })

    return byDate
  }, [activitiesData])

  const handleTabChange = (value: string) => {
    if (value === 'overview') {
      setSearchParams({})
    } else {
      setSearchParams({ tab: value })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!userGame) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(`/games/${gameId}?tab=users`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <div className="p-8 text-center text-destructive">User not found</div>
      </div>
    )
  }

  const user = userGame.user

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/games/${gameId}?tab=users`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{user?.displayName || userId}</h1>
            <p className="text-sm text-muted-foreground font-mono">{userId}</p>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="flex items-center gap-1 justify-end">
            <Calendar className="h-4 w-4" />
            Joined: {formatDate(userGame.joinedAt)}
          </div>
          {game && <div className="mt-1">Game: {game.name}</div>}
        </div>
      </div>

      {/* Stats Inline */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Coins className="h-4 w-4" />
          <span className="font-semibold text-foreground">{totalTurns}</span> turns
          {isDevMode && (
            <Popover open={grantTurnsOpen} onOpenChange={setGrantTurnsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-primary">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Grant Turns</div>
                  <div className="space-y-2">
                    <Label htmlFor="grantAmount" className="text-xs">
                      Amount
                    </Label>
                    <Input
                      id="grantAmount"
                      type="number"
                      min="1"
                      value={grantAmount}
                      onChange={(e) => setGrantAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Expiration</Label>
                    <Select
                      value={grantExpMode}
                      onValueChange={(v) => setGrantExpMode(v as ExpirationMode)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent (no expiry)</SelectItem>
                        <SelectItem value="ttl">Expires after...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {grantExpMode === 'ttl' && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={grantExpValue}
                        onChange={(e) => setGrantExpValue(e.target.value)}
                        className="w-20"
                      />
                      <Select
                        value={grantExpUnit}
                        onValueChange={(v) => setGrantExpUnit(v as ExpirationUnit)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hour">Hour(s)</SelectItem>
                          <SelectItem value="day">Day(s)</SelectItem>
                          <SelectItem value="week">Week(s)</SelectItem>
                          <SelectItem value="month">Month(s)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="grantReason" className="text-xs">
                      Reason (optional)
                    </Label>
                    <Input
                      id="grantReason"
                      placeholder="Testing, compensation..."
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleGrantTurns}
                    disabled={grantTurns.isPending}
                  >
                    {grantTurns.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Grant {grantAmount} Turn{parseInt(grantAmount) !== 1 ? 's' : ''}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Gamepad2 className="h-4 w-4" />
          <span className="font-semibold text-foreground">{totalPlays}</span> plays
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4" />
          <span className="font-semibold text-foreground">{totalScore.toLocaleString()}</span> score
        </span>
      </div>

      {/* User Attributes */}
      {userGame.attributes && Object.keys(userGame.attributes).length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* <span className="text-xs text-muted-foreground uppercase tracking-wider mr-1">Attributes:</span> */}
          {Object.entries(userGame.attributes).map(([key, value]) => (
            <Badge key={key} variant="outline" className="font-normal text-xs py-0.5 px-2">
              <span className="text-muted-foreground mr-1">{key}:</span>
              <span className="font-medium">
                {typeof value === 'boolean'
                  ? value
                    ? 'Yes'
                    : 'No'
                  : typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
              </span>
            </Badge>
          ))}
          {isDevMode && (
            <Dialog open={attributesDialogOpen} onOpenChange={setAttributesDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => {
                    const attrs = userGame.attributes || {}
                    setEditingAttributes(
                      Object.entries(attrs).map(([key, value]) => ({
                        key,
                        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                      }))
                    )
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit User Attributes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Edit attributes for this user. These are used for reward eligibility conditions.
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {editingAttributes.map((attr, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={attr.key}
                          onChange={(e) => {
                            const updated = [...editingAttributes]
                            updated[idx] = { ...updated[idx], key: e.target.value }
                            setEditingAttributes(updated)
                          }}
                          placeholder="Key"
                          className="w-32 text-sm"
                        />
                        <Input
                          value={attr.value}
                          onChange={(e) => {
                            const updated = [...editingAttributes]
                            updated[idx] = { ...updated[idx], value: e.target.value }
                            setEditingAttributes(updated)
                          }}
                          placeholder="Value"
                          className="flex-1 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setEditingAttributes(editingAttributes.filter((_, i) => i !== idx))
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {editingAttributes.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No attributes. Click "Add" to create one.
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setEditingAttributes([...editingAttributes, { key: '', value: '' }])
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Attribute
                  </Button>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" onClick={() => setAttributesDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      disabled={updateAttributes.isPending}
                      onClick={() => {
                        // Convert key-value array to object, parsing JSON values if possible
                        const attrs: Record<string, unknown> = {}
                        for (const { key, value } of editingAttributes) {
                          if (!key.trim()) continue
                          try {
                            attrs[key.trim()] = JSON.parse(value)
                          } catch {
                            attrs[key.trim()] = value
                          }
                        }
                        updateAttributes.mutate(attrs, {
                          onSuccess: () => setAttributesDialogOpen(false),
                        })
                      }}
                    >
                      {updateAttributes.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Gift className="h-4 w-4" />
            Rewards ({rewards?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="missions" className="gap-2">
            <Target className="h-4 w-4" />
            Missions ({completedMissions}/{missions?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Activity Over Time Chart */}
          {showAnalytics ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plays & Rewards (14 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {activityOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={activityOverTime}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartColors.muted}
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: chartColors.muted }}
                        tickFormatter={(v) => v.slice(5)} // MM-DD
                        stroke={chartColors.muted}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: chartColors.muted }}
                        stroke={chartColors.muted}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: chartColors.popover,
                          border: `1px solid ${chartColors.border}`,
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: chartColors.foreground }}
                        itemStyle={{ color: chartColors.foreground }}
                      />
                      <Line
                        type="monotone"
                        dataKey="plays"
                        stroke={chartColors.chart1}
                        strokeWidth={2}
                        name="Plays"
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rewards"
                        stroke={chartColors.chart4}
                        strokeWidth={2}
                        name="Rewards"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No activity data
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <AnalyticsDisabledCard description="Enable analytics to see user activity charts." />
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline dateGroups={groupedActivities} limit={5} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6 space-y-6">
          <ActivityTimeline dateGroups={groupedActivities} />
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-6 space-y-4">
          {/* Header with Check Eligibility */}
          <Collapsible open={eligibilityOpen} onOpenChange={setEligibilityOpen}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Received Rewards</h3>
              <div className="flex items-center gap-2">
                {eligibilityResults && (
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {eligibilityOpen ? 'Hide' : 'Show'} Results
                      <ChevronDown
                        className={`h-4 w-4 ml-1 transition-transform ${eligibilityOpen ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                )}
                <div className="flex">
                  <Button
                    size="sm"
                    onClick={() => handleCheckEligibility(false)}
                    disabled={checkEligibility.isPending}
                    className="rounded-r-none"
                  >
                    {checkEligibility.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Check Eligibility
                  </Button>
                  <Popover open={showClientInput} onOpenChange={setShowClientInput}>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        className="rounded-l-none border-l px-2"
                        disabled={checkEligibility.isPending}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Check with Client Input</div>
                        <div className="space-y-2">
                          <Label htmlFor="clientInput" className="text-xs">
                            Client Input (JSON)
                          </Label>
                          <Textarea
                            id="clientInput"
                            placeholder={
                              '{\n  "utm_source": "facebook",\n  "storeId": "store-001"\n}'
                            }
                            value={clientInputJson}
                            onChange={(e) => setClientInputJson(e.target.value)}
                            className="font-mono text-xs min-h-20 resize-none"
                          />
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleCheckEligibility(false)}
                          disabled={checkEligibility.isPending}
                        >
                          {checkEligibility.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          )}
                          Check Eligibility
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Eligibility Results */}
            <CollapsibleContent>
              {eligibilityResults && (
                <div className="mt-4 space-y-3">
                  {/* Summary */}
                  <div className="text-sm text-muted-foreground">
                    <span className="text-primary font-medium">
                      {eligibilityResults.filter((r) => r.isEligible).length}
                    </span>
                    {' / '}
                    {eligibilityResults.length} rewards eligible
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Sort: eligible first, then ineligible */}
                    {[...eligibilityResults]
                      .sort((a, b) => (a.isEligible === b.isEligible ? 0 : a.isEligible ? -1 : 1))
                      .map((result) => (
                        <div
                          key={result.reward.rewardId}
                          className={`rounded-lg border p-3 ${!result.isEligible ? 'opacity-70' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex items-center justify-center shrink-0 ${
                                result.isEligible ? 'text-primary' : 'text-destructive'
                              }`}
                            >
                              {result.isEligible ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                <X className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{result.reward.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {result.reward.probability}% probability
                              </div>
                              {result.checks.length > 0 && (
                                <div className="mt-1.5 space-y-0.5">
                                  {result.checks.map((check, idx) => {
                                    const isAttributeCheck = check.name === 'userAttributes'
                                    return (
                                      <div
                                        key={idx}
                                        className={`flex items-center gap-1 text-xs ${
                                          isAttributeCheck
                                            ? 'bg-chart-2/10 rounded px-1.5 py-0.5 -mx-1.5'
                                            : ''
                                        } text-muted-foreground`}
                                      >
                                        {check.passed ? (
                                          <Check className="h-3 w-3 text-primary shrink-0" />
                                        ) : (
                                          <X className="h-3 w-3 text-destructive shrink-0" />
                                        )}
                                        {isAttributeCheck && (
                                          <UserCog className="h-3 w-3 text-chart-2 shrink-0" />
                                        )}
                                        <span className="truncate">
                                          {formatConditionCheck(check)}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Received Rewards List */}
          {rewards && rewards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rewards.map((reward) => (
                <RewardItem
                  key={reward.id}
                  reward={reward}
                  gameId={gameId!}
                  userId={userId!}
                  isDevMode={isDevMode}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">No rewards found</div>
          )}
        </TabsContent>

        {/* Missions Tab */}
        <TabsContent value="missions" className="mt-6 space-y-4">
          {/* Header with Reset All Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Mission Progress</h3>
            {isDevMode && missions && missions.length > 0 && (
              <Button
                size="sm"
                variant="default"
                onClick={() => resetAllMissions.mutate()}
                disabled={resetAllMissions.isPending}
              >
                {resetAllMissions.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reset All Missions
              </Button>
            )}
          </div>

          {missions && missions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {missions.map((mission) => {
                const progress = mission.progress
                const isCompleted = progress?.isCompleted || false
                const percentage = progress
                  ? Math.min(100, (progress.currentValue / mission.targetValue) * 100)
                  : 0

                return (
                  <div key={mission.missionId} className="rounded-lg border p-3 relative group">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{mission.name}</span>
                      {isCompleted && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          ✓ Completed
                        </Badge>
                      )}
                    </div>
                    {mission.description && (
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-2 prose prose-sm max-w-none">
                        {parse(mission.description)}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {progress?.currentValue || 0} / {mission.targetValue}
                      </span>
                    </div>
                    {progress?.completedAt && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Completed: {formatDateTime(progress.completedAt)}
                      </div>
                    )}
                    {isDevMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => resetMission.mutate(mission.missionId)}
                        disabled={resetMission.isPending}
                        title="Reset mission progress"
                      >
                        {resetMission.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">No missions found</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
