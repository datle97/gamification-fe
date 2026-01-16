import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useMemo } from 'react'
import {
  ArrowLeft,
  Loader2,
  Coins,
  Gift,
  Target,
  Gamepad2,
  Trophy,
  TrendingUp,
  Calendar,
  History,
  User,
  Clock,
  Plus,
  Trash2,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  useGameUserDetail,
  useUserTurns,
  useUserRewards,
  useUserMissions,
  useUserActivities,
} from '@/hooks/useGameUsers'
import { useGame } from '@/hooks/useGames'
import { useFormatDate } from '@/hooks/useFormatDate'
import type { ActivityType } from '@/services/game-users.service'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import parse from 'html-react-parser'

type TabValue = 'overview' | 'activity' | 'rewards' | 'missions'

// Activity type labels and colors using theme variables
const ACTIVITY_CONFIG: Record<
  ActivityType,
  { label: string; colorVar: string; bgClass: string }
> = {
  game_play: { label: 'Game Plays', colorVar: 'chart-1', bgClass: 'bg-chart-1' },
  turn_earn: { label: 'Turns Earned', colorVar: 'chart-2', bgClass: 'bg-chart-2' },
  turn_spend: { label: 'Turns Spent', colorVar: 'chart-3', bgClass: 'bg-chart-3' },
  turn_expire: { label: 'Turns Expired', colorVar: 'muted-foreground', bgClass: 'bg-muted-foreground' },
  reward_earn: { label: 'Rewards Won', colorVar: 'chart-4', bgClass: 'bg-chart-4' },
  mission_complete: { label: 'Missions', colorVar: 'chart-5', bgClass: 'bg-chart-5' },
  score_earn: { label: 'Score Earned', colorVar: 'primary', bgClass: 'bg-primary' },
  admin_grant: { label: 'Admin Grant', colorVar: 'chart-2', bgClass: 'bg-chart-2' },
  admin_revoke: { label: 'Admin Revoke', colorVar: 'destructive', bgClass: 'bg-destructive' },
}

// Get icon for activity type
function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'game_play':
      return Gamepad2
    case 'turn_earn':
      return Plus
    case 'turn_spend':
      return Coins
    case 'turn_expire':
      return Clock
    case 'reward_earn':
      return Gift
    case 'mission_complete':
      return Trophy
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

export function UserDetailPage() {
  const { gameId, userId } = useParams<{ gameId: string; userId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { formatDate, formatDateTime } = useFormatDate()

  const currentTab = (searchParams.get('tab') as TabValue) || 'overview'

  // Data fetching
  const { data: game } = useGame(gameId!)
  const { data: userGame, isLoading } = useGameUserDetail(gameId!, userId!)
  const { data: turns } = useUserTurns(gameId!, userId!)
  const { data: rewards } = useUserRewards(gameId!, userId!)
  const { data: missions } = useUserMissions(gameId!, userId!)
  const { data: activitiesData } = useUserActivities(gameId!, userId!, 1, 200)

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

  // Activity breakdown for pie chart
  const activityBreakdown = useMemo(() => {
    if (!activitiesData?.activities) return []

    const counts: Record<string, number> = {}
    activitiesData.activities.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1
    })

    return Object.entries(counts)
      .map(([type, count]) => {
        const config = ACTIVITY_CONFIG[type as ActivityType]
        return {
          name: config?.label || type,
          value: count,
          colorVar: config?.colorVar || 'muted-foreground',
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [activitiesData])

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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Coins className="h-4 w-4" />
              <span className="text-sm font-medium">Turns</span>
            </div>
            <div className="text-3xl font-bold">{totalTurns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Gift className="h-4 w-4" />
              <span className="text-sm font-medium">Rewards</span>
            </div>
            <div className="text-3xl font-bold">{rewards?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="text-sm font-medium">Plays</span>
            </div>
            <div className="text-3xl font-bold">{totalPlays}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Total Score</span>
            </div>
            <div className="text-3xl font-bold">{totalScore.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Over Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity (Last 14 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {activityOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={activityOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.muted} opacity={0.3} />
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
                      <Tooltip
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

            {/* Activity Breakdown Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {activityBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={activityBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={35}
                        paddingAngle={2}
                        label={false}
                      >
                        {activityBreakdown.map((entry, index) => {
                          const colorMap: Record<string, string> = {
                            'chart-1': chartColors.chart1,
                            'chart-2': chartColors.chart2,
                            'chart-3': chartColors.chart3,
                            'chart-4': chartColors.chart4,
                            'chart-5': chartColors.chart5,
                            'primary': chartColors.primary,
                            'muted-foreground': chartColors.muted,
                            'destructive': chartColors.destructive,
                          }
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={colorMap[entry.colorVar] || chartColors.muted}
                            />
                          )
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartColors.popover,
                          border: `1px solid ${chartColors.border}`,
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        itemStyle={{ color: chartColors.foreground }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                        formatter={(value) => (
                          <span style={{ color: chartColors.foreground }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No activity data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => handleTabChange('activity')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activitiesData?.activities.slice(0, 5).map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  const config = ACTIVITY_CONFIG[activity.type]
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 py-2 border-b last:border-0"
                    >
                      <div
                        className={`p-2 rounded-full ${config?.bgClass || 'bg-muted'} text-primary-foreground`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{activity.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {(!activitiesData?.activities || activitiesData.activities.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-1">
                {activitiesData?.activities.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  const config = ACTIVITY_CONFIG[activity.type]
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 py-3 border-l-2 border-muted pl-4 relative hover:bg-muted/50 rounded-r-lg transition-colors"
                    >
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[5px] top-4 h-2 w-2 rounded-full ${config?.bgClass || 'bg-muted'}`}
                      />
                      {/* Icon */}
                      <div
                        className={`shrink-0 p-1.5 rounded-full text-primary-foreground ${config?.bgClass || 'bg-muted'}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{activity.description}</span>
                          <Badge variant="outline" className="text-xs">
                            {config?.label || activity.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {(!activitiesData?.activities || activitiesData.activities.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">No activity found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards?.map((reward) => (
              <Card key={reward.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {reward.reward?.imageUrl ? (
                      <img
                        src={reward.reward.imageUrl}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                        <Gift className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{reward.reward?.name || 'Unknown Reward'}</div>
                      {reward.reward?.rewardType && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {reward.reward.rewardType}
                        </Badge>
                      )}
                      {reward.rewardValue && (
                        <div className="text-sm text-muted-foreground font-mono mt-1 truncate">
                          {reward.rewardValue}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {formatDateTime(reward.createdAt)}
                      </div>
                      {reward.expiredAt && (
                        <div className="text-xs text-destructive">
                          Expires: {formatDate(reward.expiredAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!rewards || rewards.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No rewards found
              </div>
            )}
          </div>
        </TabsContent>

        {/* Missions Tab */}
        <TabsContent value="missions" className="mt-6">
          <div className="space-y-3">
            {missions?.map((mission) => {
              const progress = mission.progress
              const isCompleted = progress?.isCompleted || false
              const percentage = progress
                ? Math.min(100, (progress.currentValue / mission.targetValue) * 100)
                : 0

              return (
                <Card key={mission.missionId}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{mission.name}</span>
                          {isCompleted && (
                            <Badge className="bg-green-500">Completed</Badge>
                          )}
                          <Badge variant="outline">{mission.missionPeriod}</Badge>
                        </div>
                        {mission.description && (
                          <div className="text-sm text-muted-foreground mt-1 prose prose-sm max-w-none">
                            {parse(mission.description)}
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 bg-secondary rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                isCompleted ? 'bg-green-500' : 'bg-primary'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground tabular-nums font-medium">
                            {progress?.currentValue || 0} / {mission.targetValue}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Reward: {mission.rewardValue} {mission.rewardType}
                          </span>
                          {progress?.completedAt && (
                            <span>Completed: {formatDateTime(progress.completedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {(!missions || missions.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">No missions found</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
