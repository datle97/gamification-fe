import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGameUserDetail, useUserTurns, useUserRewards, useUserMissions } from '@/hooks/useGameUsers'
import { Loader2, Coins, Gift, Target } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Badge } from '@/components/ui/badge'
import parse from 'html-react-parser'

dayjs.extend(relativeTime)

interface UserDetailSheetProps {
  gameId: string
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailSheet({ gameId, userId, open, onOpenChange }: UserDetailSheetProps) {
  const { data: userGame, isLoading } = useGameUserDetail(gameId, userId || '')
  const { data: turns } = useUserTurns(gameId, userId || '')
  const { data: rewards } = useUserRewards(gameId, userId || '')
  const { data: missions } = useUserMissions(gameId, userId || '')

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!userGame) return null

  const user = userGame.user
  const totalTurns = turns?.reduce((sum, t) => sum + t.remainingAmount, 0) || 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-3">
            {user?.avatar && (
              <img src={user.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
            )}
            <div className="flex-1">
              <SheetTitle>{user?.displayName || userId}</SheetTitle>
              <SheetDescription className="font-mono text-xs">{userId}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Summary Cards - Fixed at top */}
        <div className="px-4 py-4 border-b">
          <div className="grid grid-cols-3 gap-4">
            {/* Turns Card */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium text-muted-foreground">Turns</div>
              </div>
              <div className="text-2xl font-bold mt-2">{totalTurns}</div>
            </div>

            {/* Rewards Card */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium text-muted-foreground">Rewards</div>
              </div>
              <div className="text-2xl font-bold mt-2">{rewards?.length || 0}</div>
            </div>

            {/* Missions Card */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium text-muted-foreground">Missions</div>
              </div>
              <div className="text-2xl font-bold mt-2">
                {missions?.filter((m) => m.progress?.isCompleted).length || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Scrollable content */}
        <Tabs key={userId} defaultValue="rewards" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="rewards">Rewards ({rewards?.length || 0})</TabsTrigger>
              <TabsTrigger value="missions">Missions ({missions?.length || 0})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="rewards" className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 mt-4">
            {rewards && rewards.length > 0 ? (
              rewards.map((reward) => (
                <div key={reward.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    {reward.reward?.imageUrl && (
                      <img
                        src={reward.reward.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{reward.reward?.name || 'Unknown Reward'}</div>
                      {reward.rewardValue && (
                        <div className="text-sm text-muted-foreground font-mono">
                          {reward.rewardValue}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        Received: {dayjs(reward.createdAt).format('MMM DD, YYYY HH:mm')}
                        {reward.expiredAt && (
                          <> • Expires: {dayjs(reward.expiredAt).format('MMM DD, YYYY')}</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">No rewards found</div>
            )}
          </TabsContent>

          <TabsContent value="missions" className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 mt-4">
            {missions && missions.length > 0 ? (
              missions.map((item) => {
                const progress = item.progress
                const isCompleted = progress?.isCompleted || false
                const percentage = progress
                  ? Math.min(100, (progress.currentValue / item.targetValue) * 100)
                  : 0

                return (
                  <div key={item.missionId} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {isCompleted && (
                            <Badge variant="secondary" className="text-xs">✓ Completed</Badge>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground mt-1 prose prose-sm max-w-none">
                            {parse(item.description)}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {progress?.currentValue || 0} / {item.targetValue}
                          </span>
                        </div>
                        {progress?.completedAt && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Completed: {dayjs(progress.completedAt).format('MMM DD, YYYY HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">No missions found</div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
