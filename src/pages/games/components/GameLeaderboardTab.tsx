import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { Loader2, Download, RefreshCw, Trophy, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { useLeaderboard, useLeaderboardPeriods } from '@/hooks/queries'
import { createColumnHelper } from '@/lib/column-helper'
import type { Game } from '@/schemas/game.schema'

interface LeaderboardEntry {
  userId: string
  userName?: string
  rank: number
  score: number
  plays: number
  lastActiveAt?: string
}

const columnHelper = createColumnHelper<LeaderboardEntry>()

interface GameLeaderboardTabProps {
  game: Game
}

export function GameLeaderboardTab({ game }: GameLeaderboardTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current')

  const columns = useMemo(
    () => [
      columnHelper.custom('rank', 'Rank', ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.rank <= 3 && (
            <Trophy
              className={`h-4 w-4 ${
                row.original.rank === 1
                  ? 'text-yellow-500'
                  : row.original.rank === 2
                    ? 'text-gray-400'
                    : 'text-orange-600'
              }`}
            />
          )}
          <Badge variant={row.original.rank <= 3 ? 'default' : 'secondary'}>
            #{row.original.rank}
          </Badge>
        </div>
      )),
      columnHelper.stacked('user', 'User', {
        primary: (row) => row.userName || 'Unknown User',
        secondary: (row) => row.userId,
      }),
      columnHelper.text('score', 'Score', {
        variant: 'tabular',
      }),
      columnHelper.text('plays', 'Plays', {
        variant: 'tabular',
      }),
      columnHelper.date('lastActiveAt', 'Last Active', { showTime: true }),
    ],
    []
  )

  const { data: leaderboard, isLoading, refetch, isFetching } = useLeaderboard(
    game.gameId,
    selectedPeriod === 'current' ? undefined : selectedPeriod
  )
  const { data: periods = [], isLoading: isLoadingPeriods } = useLeaderboardPeriods(game.gameId)

  const currentPeriod = useMemo(() => {
    return periods.find((p) => p.isCurrent)
  }, [periods])

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
  }

  const handleExport = () => {
    if (!leaderboard) return

    const csv = [
      ['Rank', 'User ID', 'User Name', 'Score', 'Plays', 'Last Active'],
      ...leaderboard.entries.map((entry) => [
        entry.rank,
        entry.userId,
        entry.userName || '-',
        entry.score,
        entry.plays,
        entry.lastActiveAt ? dayjs(entry.lastActiveAt).format('YYYY-MM-DD HH:mm') : '-',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leaderboard-${game.code}-${leaderboard.period.period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Initial loading state (only for first load)
  if (isLoadingPeriods) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!game.config?.leaderboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard Not Configured</CardTitle>
          <CardDescription>
            Enable leaderboard in the Config tab to start tracking rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">
              Go to the Config tab and enable Leaderboard Settings to configure ranking periods and
              tracking.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get period info for header display
  const displayPeriod = leaderboard?.period || currentPeriod

  return (
    <div className="space-y-6">
      {/* Header Controls - Always visible */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Leaderboard Rankings</h3>
          {displayPeriod && (
            <p className="text-sm text-muted-foreground">
              {displayPeriod.isCurrent ? 'Current Period' : 'Historical Period'}:{' '}
              {dayjs(displayPeriod.startDate).format('MMM D, YYYY')} -{' '}
              {dayjs(displayPeriod.endDate).format('MMM D, YYYY')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          {periods.length > 0 && (
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Period</SelectItem>
                {periods
                  .filter((p) => !p.isCurrent)
                  .slice(0, 10)
                  .map((period) => {
                    const startDate = dayjs(period.startDate)
                    const endDate = dayjs(period.endDate)
                    const isSameYear = startDate.year() === endDate.year()

                    let label = ''
                    if (period.periodType.startsWith('weekly')) {
                      label = `Week of ${startDate.format('MMM D')} - ${endDate.format(isSameYear ? 'MMM D, YYYY' : 'MMM D, YYYY')}`
                    } else if (period.periodType === 'daily') {
                      label = startDate.format('dddd, MMM D, YYYY')
                    } else if (period.periodType === 'monthly') {
                      label = startDate.format('MMMM YYYY')
                    } else {
                      label = `${period.period} (${startDate.format('MMM D')} - ${endDate.format('MMM D')})`
                    }

                    return (
                      <SelectItem key={period.period} value={period.period}>
                        {label}
                      </SelectItem>
                    )
                  })}
              </SelectContent>
            </Select>
          )}

          {/* Refresh Button */}
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          {/* Export Button */}
          <Button variant="outline" onClick={handleExport} disabled={!leaderboard || isFetching}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Content Section - Shows loading or data */}
      {isLoading || isFetching ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !leaderboard ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No Leaderboard Data</p>
            <p className="text-sm text-muted-foreground mt-1">
              No rankings available for this period yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Participants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {leaderboard.stats.totalParticipants}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Top Score</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{leaderboard.stats.topScore}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {Math.round(leaderboard.stats.averageScore * 10) / 10}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Most Active Player</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.stats.mostActivePlayer ? (
              <div>
                <p className="text-sm font-medium truncate">
                  {leaderboard.stats.mostActivePlayer.userName || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {leaderboard.stats.mostActivePlayer.plays} plays
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>
            {leaderboard.entries.length} player{leaderboard.entries.length !== 1 ? 's' : ''} ranked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={leaderboard.entries}
            emptyMessage="No players have participated in this period yet"
          />
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}
