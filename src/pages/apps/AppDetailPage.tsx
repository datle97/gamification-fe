import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/hooks/queries'
import { ArrowLeft, Gamepad2, Info, Loader2 } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { AppGamesTab } from './components/AppGamesTab'
import { AppInfoTab } from './components/AppInfoTab'

type TabValue = 'info' | 'games'

export function AppDetailPage() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = (searchParams.get('tab') as TabValue) || 'info'
  const { data: app, isLoading, error } = useApp(appId!)

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

  if (error || !app) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/apps')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Apps
        </Button>
        <div className="p-8 text-center text-destructive">
          {error ? `Failed to load app: ${error.message}` : 'App not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/apps')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{app.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{app.appId}</p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <Info className="h-4 w-4" />
            Info
          </TabsTrigger>
          <TabsTrigger value="games" className="gap-2">
            <Gamepad2 className="h-4 w-4" />
            Games
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <AppInfoTab app={app} />
        </TabsContent>

        <TabsContent value="games" className="mt-6">
          <AppGamesTab appId={app.appId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
