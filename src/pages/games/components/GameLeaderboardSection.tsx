import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { parseIntOrUndefined } from '@/lib/number-utils'
import { periodTypeLabels, type GameConfig, type PeriodType } from '@/schemas/game.schema'
import { useState } from 'react'

interface GameLeaderboardSectionProps {
  leaderboard: GameConfig['leaderboard']
  onChange: (leaderboard: GameConfig['leaderboard']) => void
}

export function GameLeaderboardSection({ leaderboard, onChange }: GameLeaderboardSectionProps) {
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(!!leaderboard)
  const [periodType, setPeriodType] = useState<PeriodType>(leaderboard?.periodType || 'all_time')
  const [limit, setLimit] = useState<string>(leaderboard?.limit?.toString() || '')
  const [uniqueTopN, setUniqueTopN] = useState<string>(leaderboard?.uniqueTopN?.toString() || '')

  const handleEnableChange = (enabled: boolean) => {
    setLeaderboardEnabled(enabled)
    if (enabled) {
      onChange({
        periodType,
        limit: parseIntOrUndefined(limit),
        uniqueTopN: parseIntOrUndefined(uniqueTopN),
      })
    } else {
      onChange(undefined)
    }
  }

  const handlePeriodTypeChange = (value: PeriodType) => {
    setPeriodType(value)
    onChange({
      periodType: value,
      limit: parseIntOrUndefined(limit),
      uniqueTopN: parseIntOrUndefined(uniqueTopN),
    })
  }

  const handleLimitChange = (value: string) => {
    setLimit(value)
    onChange({
      periodType,
      limit: parseIntOrUndefined(value),
      uniqueTopN: parseIntOrUndefined(uniqueTopN),
    })
  }

  const handleUniqueTopNChange = (value: string) => {
    setUniqueTopN(value)
    onChange({
      periodType,
      limit: parseIntOrUndefined(limit),
      uniqueTopN: parseIntOrUndefined(value),
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Leaderboard Settings</CardTitle>
            <CardDescription>Configure leaderboard ranking and period tracking</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="enable-leaderboard" className="cursor-pointer">
              {leaderboardEnabled ? 'Enabled' : 'Disabled'}
            </Label>
            <Checkbox
              id="enable-leaderboard"
              checked={leaderboardEnabled}
              onCheckedChange={(checked) => handleEnableChange(checked === true)}
            />
          </div>
        </div>
      </CardHeader>
      {leaderboardEnabled && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="periodType">Period Type</Label>
            <Select value={periodType} onValueChange={(v) => handlePeriodTypeChange(v as PeriodType)}>
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
            <Label htmlFor="limit">Leaderboard Display Limit (Optional)</Label>
            <Input
              id="limit"
              type="number"
              min="0"
              placeholder="e.g., 100"
              value={limit}
              onChange={(e) => handleLimitChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Max number of users shown in leaderboard. Leave empty for unlimited.
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
              onChange={(e) => handleUniqueTopNChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Track unique winners in top N positions. Leave empty to not track.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
