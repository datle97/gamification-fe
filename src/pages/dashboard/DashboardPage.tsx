import { Gamepad2, Package, Link2, Users, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useDashboardStats } from '@/hooks/useDashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useDashboardStats()

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
      <div className="grid grid-cols-4 gap-4">
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
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <CardDescription className="font-medium">Active Links</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{stats.totalLinks}</p>
            <p className="text-sm text-muted-foreground mt-1">app-game connections</p>
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
          {stats.topGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No games available</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total Users</TableHead>
                  <TableHead className="text-right">Active Today</TableHead>
                  <TableHead className="text-right">Active (7 days)</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topGames.map((game, index) => (
                  <TableRow
                    key={game.gameId}
                    className="cursor-pointer"
                    onClick={() => navigate(`/games/${game.gameId}`)}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{game.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{game.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {game.type || 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {game.totalUsers.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="flex items-center justify-end gap-1">
                        <Activity className="h-3 w-3 text-primary" />
                        {game.activeToday}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {game.activeLast7Days}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={game.isActive ? 'default' : 'secondary'}>
                        {game.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
