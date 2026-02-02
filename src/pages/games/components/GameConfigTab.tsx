import { Button } from '@/components/ui/button'
import { useUpdateGame } from '@/hooks/queries'
import { type Game, type GameConfig } from '@/schemas/game.schema'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { GameHooksSection } from './GameHooksSection'
import { GameLeaderboardSection } from './GameLeaderboardSection'
import { GamePlayScoreSection } from './GamePlayScoreSection'
import { GameRestrictionsSection } from './GameRestrictionsSection'

interface GameConfigTabProps {
  game: Game
}

export function GameConfigTab({ game }: GameConfigTabProps) {
  const updateGame = useUpdateGame()

  // Config state
  const [leaderboard, setLeaderboard] = useState<GameConfig['leaderboard']>(
    game.config?.leaderboard
  )
  const [playScore, setPlayScore] = useState<number>(game.config?.playScore || 1)
  const [restrictions, setRestrictions] = useState<GameConfig['restrictions']>(
    game.config?.restrictions
  )
  const [hooks, setHooks] = useState<GameConfig['hooks']>(game.config?.hooks)

  const handleSave = async () => {
    const config: GameConfig = {
      ...game.config,
      leaderboard,
      playScore,
      restrictions,
      hooks,
    }

    await updateGame.mutateAsync({
      id: game.gameId,
      data: { config },
    })
  }

  const isPending = updateGame.isPending

  return (
    <div className="space-y-6">
      <GameLeaderboardSection leaderboard={leaderboard} onChange={setLeaderboard} />

      <GamePlayScoreSection playScore={playScore} onChange={setPlayScore} />

      <GameRestrictionsSection restrictions={restrictions} onChange={setRestrictions} />

      <GameHooksSection hooks={hooks} onChange={setHooks} />

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
