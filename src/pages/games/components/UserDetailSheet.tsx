import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useGameUserDetail,
  useUserTurns,
  useUserRewards,
  useUserMissions,
  useCheckEligibility,
} from '@/hooks/useGameUsers'
import type { RewardEligibilityResult } from '@/services/game-users.service'
import {
  Loader2,
  Coins,
  Gift,
  Target,
  ChevronDown,
  Check,
  X,
  Search,
  Settings2,
} from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Badge } from '@/components/ui/badge'
import parse from 'html-react-parser'

dayjs.extend(relativeTime)

// Format condition check to human-readable text
function formatConditionCheck(check: {
  name: string
  passed: boolean
  detail?: Record<string, unknown>
}): string {
  const { name, passed, detail } = check

  switch (name) {
    case 'requiresRewards': {
      const required = detail?.required as
        | { rewardIds?: string[]; count?: number; mode?: string }
        | undefined
      const owned = (detail?.owned as string[]) || []
      if (!required?.rewardIds?.length)
        return passed ? 'Has required rewards' : 'Missing required rewards'
      const mode = required.mode || 'all'
      const count = required.count || required.rewardIds.length
      if (mode === 'all') {
        return passed
          ? `Has all ${required.rewardIds.length} required rewards`
          : `Need all ${required.rewardIds.length} rewards, has ${owned.length}`
      }
      return passed
        ? `Has ${owned.length}/${count} required rewards`
        : `Need ${count} rewards, has ${owned.length}`
    }

    case 'uniqueness': {
      const maxPerUser = detail?.maxPerUser as number | undefined
      const ownedCount = (detail?.ownedCount as number) || 0
      if (maxPerUser === undefined || maxPerUser === null) return 'No limit'
      return passed
        ? `Limit ${maxPerUser}/user (has ${ownedCount})`
        : `Limit ${maxPerUser}/user, already has ${ownedCount}`
    }

    case 'userAttributes': {
      const required = detail?.required as
        | { field?: string; op?: string; value?: unknown }
        | undefined
      const actual = detail?.actual as Record<string, unknown> | undefined
      if (!required?.field) return passed ? 'Attributes OK' : 'Attributes not met'
      const actualValue = actual?.[required.field]
      const opText = formatOperator(required.op)
      return passed
        ? `${required.field} = ${actualValue ?? 0} (${opText} ${required.value})`
        : `Need ${required.field} ${opText} ${required.value}, has ${actualValue ?? 0}`
    }

    case 'clientInput': {
      const required = detail?.required as
        | { field?: string; op?: string; value?: unknown }
        | undefined
      const actual = detail?.actual as Record<string, unknown> | undefined
      if (!required?.field) return passed ? 'Input OK' : 'Input not provided'
      const actualValue = actual?.[required.field]
      const opText = formatOperator(required.op)
      return passed
        ? `${required.field} = ${actualValue}`
        : `Need ${required.field} ${opText} ${required.value}${actualValue !== undefined ? `, got ${actualValue}` : ''}`
    }

    case 'timeWindow': {
      const tw = detail as
        | { startDate?: string; endDate?: string; hours?: [number, number] }
        | undefined
      if (!tw) return passed ? 'Within time window' : 'Outside time window'
      if (tw.hours) {
        return passed
          ? `Active ${tw.hours[0]}:00-${tw.hours[1]}:00`
          : `Only active ${tw.hours[0]}:00-${tw.hours[1]}:00`
      }
      return passed ? 'Within time window' : 'Outside time window'
    }

    case 'userSegment': {
      return passed ? 'In target segment' : 'Not in target segment'
    }

    case 'leaderboardScore': {
      const required = detail?.required as { op?: string; value?: number } | undefined
      const actual = detail?.actual as number | undefined
      if (!required) return passed ? 'Score OK' : 'Score not met'
      const opText = formatOperator(required.op)
      return passed
        ? `Score = ${actual ?? 0} (${opText} ${required.value})`
        : `Need score ${opText} ${required.value}, has ${actual ?? 0}`
    }

    default:
      return name
  }
}

function formatOperator(op?: string): string {
  switch (op) {
    case 'eq':
      return '='
    case 'ne':
      return '≠'
    case 'gt':
      return '>'
    case 'gte':
      return '≥'
    case 'lt':
      return '<'
    case 'lte':
      return '≤'
    case 'in':
      return 'in'
    case 'not_in':
      return 'not in'
    default:
      return op || '='
  }
}

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

  // Check eligibility state
  const [showClientInput, setShowClientInput] = useState(false)
  const [clientInputJson, setClientInputJson] = useState('')
  const [eligibilityResults, setEligibilityResults] = useState<RewardEligibilityResult[] | null>(
    null
  )
  const [eligibilityOpen, setEligibilityOpen] = useState(false)
  const checkEligibility = useCheckEligibility(gameId, userId || '')

  const handleCheckEligibility = (withClientInput: boolean) => {
    if (withClientInput) {
      setShowClientInput(true)
      return
    }

    let clientInput: Record<string, unknown> | undefined
    if (clientInputJson.trim()) {
      try {
        clientInput = JSON.parse(clientInputJson)
      } catch {
        // Invalid JSON, ignore
      }
    }

    checkEligibility.mutate(clientInput ? { clientInput } : undefined, {
      onSuccess: (data) => {
        setEligibilityResults(data)
        setEligibilityOpen(true)
        setShowClientInput(false)
      },
    })
  }

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

          <TabsContent value="rewards" className="flex-1 overflow-y-auto px-4 pb-4 mt-4">
            {/* Check Eligibility Section */}
            <div className="mb-4">
              <Collapsible open={eligibilityOpen} onOpenChange={setEligibilityOpen}>
                <div className="flex items-center gap-2">
                  {/* Button with dropdown */}
                  <div className="flex">
                    <Button
                      size="sm"
                      onClick={() => handleCheckEligibility(false)}
                      disabled={checkEligibility.isPending}
                      className="rounded-r-none"
                    >
                      {checkEligibility.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Check Eligibility
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="default"
                          className="rounded-l-none border-l border-l-primary-foreground/20 px-2"
                          disabled={checkEligibility.isPending}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCheckEligibility(true)}>
                          <Settings2 className="h-4 w-4 mr-2" />
                          With Client Input
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {eligibilityResults && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {eligibilityOpen ? 'Hide' : 'Show'} Results
                        <ChevronDown
                          className={`h-4 w-4 ml-1 transition-transform ${eligibilityOpen ? 'rotate-180' : ''}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>

                {/* Client Input Form */}
                {showClientInput && (
                  <div className="mt-3 p-3 rounded-lg border bg-muted/50">
                    <Label htmlFor="clientInput" className="text-sm font-medium">
                      Client Input (JSON)
                    </Label>
                    <Input
                      id="clientInput"
                      placeholder='{"utm_source": "facebook", "storeId": "store-001"}'
                      value={clientInputJson}
                      onChange={(e) => setClientInputJson(e.target.value)}
                      className="mt-2 font-mono text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleCheckEligibility(false)}
                        disabled={checkEligibility.isPending}
                      >
                        Check
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowClientInput(false)
                          setClientInputJson('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Eligibility Results */}
                <CollapsibleContent>
                  {eligibilityResults && (
                    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                      {/* Summary */}
                      <div className="text-sm text-muted-foreground mb-2">
                        <span className="text-primary font-medium">
                          {eligibilityResults.filter((r) => r.isEligible).length}
                        </span>
                        {' / '}
                        {eligibilityResults.length} rewards eligible
                      </div>

                      {/* Eligible rewards first */}
                      {eligibilityResults
                        .filter((r) => r.isEligible)
                        .map((result) => (
                          <div key={result.reward.rewardId} className="rounded-lg border p-3">
                            <div className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{result.reward.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {result.reward.probability}% probability
                                </div>
                                {result.checks.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {result.checks.map((check, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                      >
                                        <Check className="h-3 w-3 text-primary shrink-0" />
                                        <span>{formatConditionCheck(check)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* Ineligible rewards - collapsible */}
                      {eligibilityResults.filter((r) => !r.isEligible).length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full py-2">
                            <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-180" />
                            <span>
                              {eligibilityResults.filter((r) => !r.isEligible).length} ineligible
                              rewards
                            </span>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-2">
                            {eligibilityResults
                              .filter((r) => !r.isEligible)
                              .map((result) => (
                                <div key={result.reward.rewardId} className="rounded-lg border p-3">
                                  <div className="flex items-start gap-2">
                                    <X className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium">{result.reward.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {result.reward.probability}% probability
                                      </div>
                                      {result.checks.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          {result.checks.map((check, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                            >
                                              {check.passed ? (
                                                <Check className="h-3 w-3 text-primary shrink-0" />
                                              ) : (
                                                <X className="h-3 w-3 text-destructive shrink-0" />
                                              )}
                                              <span>{formatConditionCheck(check)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Received Rewards List */}
            <div className="space-y-2">
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
                <div className="text-center text-sm text-muted-foreground py-8">
                  No rewards found
                </div>
              )}
            </div>
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
                            <Badge variant="secondary" className="text-xs">
                              ✓ Completed
                            </Badge>
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
              <div className="text-center text-sm text-muted-foreground py-8">
                No missions found
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
