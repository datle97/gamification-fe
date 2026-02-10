import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGame } from '@/hooks/queries'
import { useDevMode } from '@/stores/settingsStore'
import {
  ArrowLeft,
  FlaskConical,
  Gift,
  Info,
  Loader2,
  Settings,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { GameConfigTab } from './components/GameConfigTab'
import { GameInfoTab } from './components/GameInfoTab'
import { GameLeaderboardTab } from './components/GameLeaderboardTab'
import { GameMissionsTab } from './components/GameMissionsTab'
import { GameRewardsTab } from './components/GameRewardsTab'
import { GameUsersTab } from './components/GameUsersTab'
import { TestSandboxTab } from './components/TestSandboxTab'

type TabValue = 'info' | 'config' | 'users' | 'missions' | 'rewards' | 'leaderboard' | 'sandbox'

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isDevMode = useDevMode()

  const currentTab = (searchParams.get('tab') as TabValue) || 'info'
  const { data: game, isLoading, error } = useGame(gameId!)

  const handleTabChange = (value: string) => {
    if (value === 'info') {
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

  if (error || !game) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/games')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        <div className="p-8 text-center text-destructive">
          {error ? `Failed to load game: ${error.message}` : 'Game not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/games')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{game.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{game.code}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <div className="relative -mx-1 px-1">
          <div className="overflow-x-auto pb-1 scrollbar-hide">
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="info" className="gap-2">
                <Info className="h-4 w-4" />
                Info
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings className="h-4 w-4" />
                Config
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="missions" className="gap-2">
                <Target className="h-4 w-4" />
                Missions
              </TabsTrigger>
              <TabsTrigger value="rewards" className="gap-2">
                <Gift className="h-4 w-4" />
                Rewards
              </TabsTrigger>
              {isDevMode && (
                <TabsTrigger value="sandbox" className="gap-2">
                  <FlaskConical className="h-4 w-4" />
                  Sandbox
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        <TabsContent value="info" className="mt-6">
          <GameInfoTab game={game} />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <GameConfigTab game={game} />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <GameLeaderboardTab game={game} />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <GameUsersTab gameId={game.gameId} />
        </TabsContent>

        <TabsContent value="missions" className="mt-6">
          <GameMissionsTab gameId={game.gameId} />
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <GameRewardsTab gameId={game.gameId} />
        </TabsContent>

        {isDevMode && (
          <TabsContent value="sandbox" className="mt-6">
            <TestSandboxTab gameId={game.gameId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
