import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateGame } from '@/hooks/queries'
import type { Game, PeriodType } from '@/schemas/game.schema'

interface GameConfigTabProps {
  game: Game
}

const periodTypeLabels: Record<PeriodType, string> = {
  daily: 'Daily',
  weekly: 'Weekly (Monday start)',
  weekly_mon: 'Weekly (Monday start)',
  weekly_sun: 'Weekly (Sunday start)',
  weekly_fri: 'Weekly (Friday start)',
  monthly: 'Monthly',
  all_time: 'All-Time',
}

export function GameConfigTab({ game }: GameConfigTabProps) {
  const updateGame = useUpdateGame()

  // Leaderboard state
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(!!game.config?.leaderboard)
  const [periodType, setPeriodType] = useState<PeriodType>(
    game.config?.leaderboard?.periodType || 'all_time'
  )
  const [uniqueTopN, setUniqueTopN] = useState<string>(
    game.config?.leaderboard?.uniqueTopN?.toString() || ''
  )

  // Play score state
  const [playScore, setPlayScore] = useState<string>(
    game.config?.playScore?.toString() || '1'
  )

  const handleSave = async () => {
    const config = {
      ...game.config,
      playScore: parseInt(playScore) || 1,
      leaderboard: leaderboardEnabled
        ? {
            periodType,
            uniqueTopN: uniqueTopN ? parseInt(uniqueTopN) : undefined,
          }
        : undefined,
    }

    await updateGame.mutateAsync({
      id: game.gameId,
      data: { config },
    })
  }

  const isPending = updateGame.isPending

  return (
    <div className="space-y-6">
      {/* Leaderboard Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leaderboard Settings</CardTitle>
              <CardDescription>
                Configure leaderboard ranking and period tracking
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="enable-leaderboard" className="cursor-pointer">
                {leaderboardEnabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Checkbox
                id="enable-leaderboard"
                checked={leaderboardEnabled}
                onCheckedChange={(checked) => setLeaderboardEnabled(checked === true)}
              />
            </div>
          </div>
        </CardHeader>
        {leaderboardEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="periodType">Period Type</Label>
              <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
                <SelectTrigger id="periodType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{periodTypeLabels.daily}</SelectItem>
                  <SelectItem value="weekly_mon">{periodTypeLabels.weekly_mon}</SelectItem>
                  <SelectItem value="weekly_sun">{periodTypeLabels.weekly_sun}</SelectItem>
                  <SelectItem value="weekly_fri">{periodTypeLabels.weekly_fri}</SelectItem>
                  <SelectItem value="monthly">{periodTypeLabels.monthly}</SelectItem>
                  <SelectItem value="all_time">{periodTypeLabels.all_time}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Period to track and reset leaderboard rankings
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uniqueTopN">Track Top Winners (Optional)</Label>
              <Input
                id="uniqueTopN"
                type="number"
                min="0"
                placeholder="e.g., 10"
                value={uniqueTopN}
                onChange={(e) => setUniqueTopN(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Track unique winners in top N positions. Leave empty to not track.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Scoring Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Settings</CardTitle>
          <CardDescription>Configure how points are awarded per game play</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playScore">Points Per Play</Label>
            <Input
              id="playScore"
              type="number"
              min="0"
              value={playScore}
              onChange={(e) => setPlayScore(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Score per play. Default: 1. Use 0 for games where points come only from rewards/sharing.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
