import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseIntOrDefault } from '@/lib/number-utils'
import { useState } from 'react'

interface GamePlayScoreSectionProps {
  playScore: number | undefined
  onChange: (playScore: number) => void
}

export function GamePlayScoreSection({ playScore, onChange }: GamePlayScoreSectionProps) {
  const [score, setScore] = useState<string>(playScore?.toString() || '1')

  const handleChange = (value: string) => {
    setScore(value)
    onChange(parseIntOrDefault(value, 1))
  }

  return (
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
            value={score}
            onChange={(e) => handleChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Score per play. Default: 1. Use 0 for games where points come only from
            rewards/sharing.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
