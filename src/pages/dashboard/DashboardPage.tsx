import { useMemo } from 'react'
import { Gamepad2, Package, Calendar, Users, TrendingUp, Activity, Trophy, Gift } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { useDashboardStats } from '@/hooks/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router'
import { createColumnHelper } from '@/lib/column-helper'
import { gameTypeLabels } from '@/schemas/game.schema'
import { useAnalytics } from '@/stores/settingsStore'
import { AnalyticsDisabledCard } from '@/components/common/AnalyticsDisabledCard'

// Types for dashboard tables
interface RecentWinner {
  gameId: string
  gameName: string
  gameCode: string
  userName: string | null
  score: number
}

interface TopGame {
  gameId: string
  name: string
  code: string
  type: string | null
  totalUsers: number
  activeToday: number
  activeLast7Days: number
  isActive: boolean
}

const winnerColumnHelper = createColumnHelper<RecentWinner>()
const topGameColumnHelper = createColumnHelper<TopGame>()


export function DashboardPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useDashboardStats()
  const showAnalytics = useAnalytics()

  const winnerColumns = useMemo(
    () => [
      winnerColumnHelper.stacked('game', 'Game', {
        primary: (row) => row.gameName,
        secondary: (row) => row.gameCode,
      }),
      winnerColumnHelper.custom('userName', 'Winner', ({ row }) => (
        <div className="flex items-center gap-2">
          <Trophy className="h-3 w-3 text-yellow-500" />
          <span className="text-sm">{row.original.userName || 'Unknown'}</span>
        </div>
      )),
      winnerColumnHelper.text('score', 'Score', {
        format: (v) => v.toLocaleString(),
      }),
    ],
    []
  )

  const topGameColumns = useMemo(
    () => [
      topGameColumnHelper.stacked('game', 'Game', {
        primary: (row) => row.name,
        secondary: (row) => row.code,
      }),
      topGameColumnHelper.badge('type', 'Type', { labels: gameTypeLabels }),
      topGameColumnHelper.text('totalUsers', 'Total Users', {
        variant: 'tabular',
        format: (v) => v.toLocaleString(),
      }),
      topGameColumnHelper.custom('activeToday', 'Active Today', ({ row }) => (
        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-primary" />
          <span className="tabular-nums">{row.original.activeToday}</span>
        </div>
      )),
      topGameColumnHelper.text('activeLast7Days', 'Active (7 days)', {
        variant: 'tabular',
      }),
      topGameColumnHelper.status('isActive', 'Status'),
    ],
    []
  )

  // Show analytics disabled card when analytics is off
  if (!showAnalytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your gamification system</p>
        </div>
        <AnalyticsDisabledCard description="Enable analytics to see dashboard statistics, recent winners, rewards distribution, and top games." />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your gamification system</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your gamification system</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Failed to load dashboard data
          </CardContent>
        </Card>
      </div>
    )
  }

return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your gamification system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-primary/10 to-primary/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <CardDescription className="font-medium">Total Games</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{stats.totalGames}</p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-primary font-medium">{stats.activeGames}</span> active
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-primary/10 to-primary/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <CardDescription className="font-medium">Total Apps</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{stats.totalApps}</p>
            <p className="text-sm text-muted-foreground mt-1">registered apps</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-primary/10 to-primary/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardDescription className="font-medium">Total Users</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {stats.totalUsers.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-primary font-medium">{stats.activeUsersToday}</span> active today
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-primary/10 to-primary/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <CardDescription className="font-medium">Active (7 days)</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {stats.activeUsersLast7Days.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">users in last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Winners & Rewards Distribution */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Winners */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Winners</CardTitle>
                <CardDescription>Current period leaders across games</CardDescription>
              </div>
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={winnerColumns}
              data={stats.recentWinners.slice(0, 5)}
              emptyMessage="No leaderboard data available"
              onRowClick={(winner) => navigate(`/games/${winner.gameId}?tab=leaderboard`)}
            />
          </CardContent>
        </Card>

        {/* Rewards Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rewards Distribution</CardTitle>
                <CardDescription>Top games by rewards distributed</CardDescription>
              </div>
              <Gift className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {stats.rewardsDistribution.totalDistributed === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No rewards distributed yet
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">
                    {stats.rewardsDistribution.totalDistributed.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">total rewards</span>
                </div>
                <div className="space-y-2">
                  {stats.rewardsDistribution.byGame.map((game) => (
                    <div
                      key={game.gameId}
                      className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                      onClick={() => navigate(`/games/${game.gameId}?tab=rewards`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{game.gameName}</span>
                          <div className="text-sm text-right">
                            <span className="tabular-nums font-medium">
                              {game.count.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              / {game.quota !== null ? game.quota.toLocaleString() : 'Unlimited'}
                              {game.quotaUsage !== null && ` (${game.quotaUsage}%)`}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all ${
                              game.quotaUsage === null
                                ? 'bg-primary/50'
                                : game.quotaUsage >= 90
                                  ? 'bg-destructive'
                                  : game.quotaUsage >= 70
                                    ? 'bg-yellow-500'
                                    : 'bg-primary'
                            }`}
                            style={{ width: game.quotaUsage !== null ? `${Math.min(game.quotaUsage, 100)}%` : '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Games Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Games by Users</CardTitle>
              <CardDescription>Most popular games ranked by total users</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={topGameColumns}
            data={stats.topGames}
            emptyMessage="No games available"
            onRowClick={(game) => navigate(`/games/${game.gameId}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
