import { useParams, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGame } from '@/hooks/useGames'
import { GameInfoTab } from './components/GameInfoTab'
import { GameConfigTab } from './components/GameConfigTab'
import { GameMissionsTab } from './components/GameMissionsTab'
import { GameRewardsTab } from './components/GameRewardsTab'
import { GameUsersTab } from './components/GameUsersTab'

type TabValue = 'info' | 'config' | 'users' | 'missions' | 'rewards'

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

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
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <GameInfoTab game={game} />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <GameConfigTab game={game} />
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
      </Tabs>
    </div>
  )
}
