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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useLeaderboard, useLeaderboardPeriods } from '@/hooks/useGames'
import type { Game } from '@/schemas/game.schema'

interface GameLeaderboardTabProps {
  game: Game
}

export function GameLeaderboardTab({ game }: GameLeaderboardTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined)

  const { data: leaderboard, isLoading, refetch } = useLeaderboard(game.gameId, selectedPeriod)
  const { data: periods = [], isLoading: isLoadingPeriods } = useLeaderboardPeriods(game.gameId)

  const currentPeriod = useMemo(() => {
    return periods.find((p) => p.isCurrent)
  }, [periods])

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

  if (isLoading || isLoadingPeriods) {
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

  if (!leaderboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Leaderboard Data</CardTitle>
          <CardDescription>No rankings available for this game yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Leaderboard Rankings</h3>
          <p className="text-sm text-muted-foreground">
            {leaderboard.period.isCurrent ? 'Current Period' : 'Historical Period'}:{' '}
            {dayjs(leaderboard.period.startDate).format('MMM D, YYYY')} -{' '}
            {dayjs(leaderboard.period.endDate).format('MMM D, YYYY')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          {periods.length > 0 && (
            <Select value={selectedPeriod || 'current'} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
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
                      // Weekly: "Week of Jan 12 - Jan 18, 2026"
                      label = `Week of ${startDate.format('MMM D')} - ${endDate.format(isSameYear ? 'MMM D, YYYY' : 'MMM D, YYYY')}`
                    } else if (period.periodType === 'daily') {
                      // Daily: "Monday, Jan 12, 2026"
                      label = startDate.format('dddd, MMM D, YYYY')
                    } else if (period.periodType === 'monthly') {
                      // Monthly: "January 2026"
                      label = startDate.format('MMMM YYYY')
                    } else {
                      // Fallback to original format
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
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Export Button */}
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

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
          {leaderboard.entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No players have participated in this period yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Plays</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.entries.map((entry) => (
                  <TableRow key={entry.userId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.rank <= 3 && (
                          <Trophy
                            className={`h-4 w-4 ${
                              entry.rank === 1
                                ? 'text-yellow-500'
                                : entry.rank === 2
                                  ? 'text-gray-400'
                                  : 'text-orange-600'
                            }`}
                          />
                        )}
                        <Badge variant={entry.rank <= 3 ? 'default' : 'secondary'}>
                          #{entry.rank}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.userName || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{entry.userId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {entry.score}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{entry.plays}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {entry.lastActiveAt
                        ? dayjs(entry.lastActiveAt).format('MMM D, HH:mm')
                        : '-'}
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
