import { AnalyticsDisabledCard } from '@/components/common/AnalyticsDisabledCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { useGameStats, useGameUsers } from '@/hooks/queries'
import { useDebounce } from '@/hooks/useDebounce'
import { createColumnHelper } from '@/lib/column-helper'
import type { GameUser } from '@/services/game-users.service'
import { useAnalytics } from '@/stores/settingsStore'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Activity, Loader2, Search, TrendingUp, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

dayjs.extend(relativeTime)

const columnHelper = createColumnHelper<GameUser>()

interface GameUsersTabProps {
  gameId: string
}

export function GameUsersTab({ gameId }: GameUsersTabProps) {
  const navigate = useNavigate()
  const showAnalytics = useAnalytics()
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const debouncedSearch = useDebounce(searchInput, 300)

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedSearch !== searchInput) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [debouncedSearch, searchInput])

  const { data: stats, isLoading: statsLoading } = useGameStats(gameId)
  const { data: usersData, isLoading: usersLoading } = useGameUsers({
    gameId,
    search: debouncedSearch || undefined,
    page,
    limit,
    sortBy: 'lastActive',
    sortOrder: 'DESC',
  })

  const totalPages = usersData ? Math.ceil(usersData.total / limit) : 0
  const isSearching = searchInput !== debouncedSearch || (debouncedSearch && usersLoading)

  const handleClearSearch = () => {
    setSearchInput('')
    setPage(1)
  }

  const handleRowClick = (userId: string) => {
    navigate(`/games/${gameId}/users/${userId}`)
  }

  const columns = useMemo(
    () => [
      columnHelper.text('userId', 'User ID', { variant: 'primary' }),
      columnHelper.avatar('displayName', 'Display Name', {
        name: (row) => row.user?.displayName,
        avatar: (row) => row.user?.avatar,
      }),
      columnHelper.text('userId', 'Phone', {
        variant: 'secondary',
        render: (row) => row.user?.phone,
      }),
      columnHelper.date('joinedAt', 'Joined', { relative: true }),
      columnHelper.custom('lastActiveAt', 'Last Active', ({ row }) => {
        const date = row.original.lastActiveAt
        if (!date) return <span className="text-muted-foreground">Never</span>

        const isRecent = dayjs().diff(date, 'hour') < 24
        return (
          <div className="flex items-center gap-2">
            {isRecent && (
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            )}
            <span className="text-sm">{dayjs(date).fromNow()}</span>
          </div>
        )
      }),
    ],
    []
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards - show AnalyticsDisabledCard when analytics disabled */}
      {showAnalytics ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-2xl font-bold text-muted-foreground">...</div>
              ) : (
                <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString() || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-2xl font-bold text-muted-foreground">...</div>
              ) : (
                <div className="text-2xl font-bold">{stats?.activeToday.toLocaleString() || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Last 7 Days</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-2xl font-bold text-muted-foreground">...</div>
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.activeLast7Days.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <AnalyticsDisabledCard description="Enable analytics to see user statistics like total users, active today, and weekly active users." />
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <div className="flex items-center gap-2 pt-4">
            <div className="relative flex-1">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : (
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                placeholder="Search by user ID, name, or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={handleClearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={usersData?.data || []}
            loading={usersLoading}
            pagination={{
              page,
              pageSize: limit,
              totalPages,
              onPageChange: setPage,
            }}
            onRowClick={(row) => handleRowClick(row.userId)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
