import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useResetUserState, useSandboxUser, useTestPlay } from '@/hooks/queries'
import type { TestPlayResult } from '@/services/game-users.service'
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Gift,
  Loader2,
  Play,
  RotateCcw,
  User,
} from 'lucide-react'
import { useState } from 'react'

interface TestSandboxTabProps {
  gameId: string
}

export function TestSandboxTab({ gameId }: TestSandboxTabProps) {
  const [clientInputJson, setClientInputJson] = useState('{}')
  const [attributeOverridesJson, setAttributeOverridesJson] = useState('{}')
  const [testResult, setTestResult] = useState<TestPlayResult | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const { data: sandboxUser, isLoading: sandboxLoading } = useSandboxUser(gameId)

  const testPlay = useTestPlay(gameId, sandboxUser?.userId || '')
  const resetState = useResetUserState(gameId, sandboxUser?.userId || '')

  const validateJson = (json: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(json)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Must be a JSON object')
      }
      return parsed
    } catch {
      return null
    }
  }

  const handleRunTest = async () => {
    setJsonError(null)
    setTestResult(null)

    const clientInput = validateJson(clientInputJson)
    const attributeOverrides = validateJson(attributeOverridesJson)

    if (clientInputJson !== '{}' && !clientInput) {
      setJsonError('Client Input must be valid JSON object')
      return
    }
    if (attributeOverridesJson !== '{}' && !attributeOverrides) {
      setJsonError('Attribute Overrides must be valid JSON object')
      return
    }

    try {
      const result = await testPlay.mutateAsync({
        clientInput: clientInput || undefined,
        attributeOverrides: attributeOverrides || undefined,
      })
      setTestResult(result)
    } catch (error) {
      console.error('Test play failed:', error)
    }
  }

  const handleResetState = async () => {
    try {
      await resetState.mutateAsync()
      setTestResult(null)
    } catch (error) {
      console.error('Reset state failed:', error)
    }
  }

  if (sandboxLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Test Sandbox</h2>
            <p className="text-sm text-muted-foreground">
              Test game play without affecting real users
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sandbox User Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {sandboxUser?.displayName || 'Sandbox Test User'}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {sandboxUser?.userId}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{sandboxUser?.remainingTurns ?? 0} turns</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetState}
                  disabled={resetState.isPending}
                >
                  {resetState.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Reset</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This sandbox user is automatically created for testing. Turns are auto-granted when
              needed. Use the Reset button to clear all test data (turns, rewards, missions,
              scores).
            </p>
          </CardContent>
        </Card>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test Configuration</CardTitle>
            <CardDescription>Configure input data for the test play</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientInput">Client Input (JSON)</Label>
              <Textarea
                id="clientInput"
                value={clientInputJson}
                onChange={(e) => setClientInputJson(e.target.value)}
                placeholder='{"key": "value"}'
                className="font-mono text-sm min-h-20"
              />
              <p className="text-xs text-muted-foreground">
                Data passed to the game engine during play
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attributeOverrides">Attribute Overrides (JSON)</Label>
              <Textarea
                id="attributeOverrides"
                value={attributeOverridesJson}
                onChange={(e) => setAttributeOverridesJson(e.target.value)}
                placeholder='{"tierLevel": "gold"}'
                className="font-mono text-sm min-h-20"
              />
              <p className="text-xs text-muted-foreground">
                Override user attributes before running the test
              </p>
            </div>

            {jsonError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{jsonError}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleRunTest} disabled={testPlay.isPending} className="w-full">
              {testPlay.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Test
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Test Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold">{testResult.success ? 'Success' : 'Failed'}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Remaining Turns</p>
                <p className="text-lg font-semibold">{testResult.remainingTurns}</p>
              </div>
            </div>

            {testResult.message && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{testResult.message}</p>
              </div>
            )}

            {testResult.rewards.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Rewards Earned</p>
                <div className="space-y-2">
                  {testResult.rewards.map((reward, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      {reward.imageUrl ? (
                        <img
                          src={reward.imageUrl}
                          alt={reward.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Gift className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{reward.name}</p>
                        {reward.rewardType && (
                          <Badge variant="secondary" className="text-xs">
                            {reward.rewardType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testResult.rewards.length === 0 && testResult.success && (
              <div className="text-center py-4 text-muted-foreground">
                <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No rewards earned this round</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {testPlay.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Test Failed</AlertTitle>
          <AlertDescription>
            {testPlay.error?.message || 'An error occurred while running the test'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
