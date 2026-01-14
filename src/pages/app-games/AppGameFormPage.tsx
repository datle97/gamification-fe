import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useApps } from '@/hooks/useApps'
import { useGames } from '@/hooks/useGames'
import { useCreateLink } from '@/hooks/useLinks'

export function AppGameFormPage() {
  const navigate = useNavigate()
  const { data: apps = [], isLoading: appsLoading } = useApps()
  const { data: games = [], isLoading: gamesLoading } = useGames()
  const createLink = useCreateLink()

  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [selectedGameId, setSelectedGameId] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppId || !selectedGameId) return

    await createLink.mutateAsync({
      appId: selectedAppId,
      gameId: selectedGameId,
    })

    navigate('/app-games')
  }

  const isLoading = appsLoading || gamesLoading

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app-games')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to App Games
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Link Game to App</CardTitle>
          <CardDescription>
            Link a game to an app. Game settings (status, schedule) are managed in the Games page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app">App</Label>
              <Select
                value={selectedAppId}
                onValueChange={setSelectedAppId}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select app" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem key={app.appId} value={app.appId}>
                      {app.name}
                      <span className="ml-2 text-xs text-muted-foreground font-mono">
                        ({app.appId})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="game">Game</Label>
              <Select
                value={selectedGameId}
                onValueChange={setSelectedGameId}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((game) => (
                    <SelectItem key={game.gameId} value={game.gameId}>
                      {game.name}
                      <span className="ml-2 text-xs text-muted-foreground font-mono">
                        ({game.code})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={!selectedAppId || !selectedGameId || createLink.isPending}
              >
                {createLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Link
              </Button>
              <Button variant="outline" onClick={() => navigate('/app-games')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
