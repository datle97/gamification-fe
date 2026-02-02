import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

interface AttributeUpdate {
  field: string
  op: 'increment' | 'set'
  value?: unknown
}

interface CdpEventConfig {
  ea: string
  ec: string
  portal_id: number
  prop_id: number
}

interface HooksConfig {
  onPlaySuccess?: {
    updateAttributes?: AttributeUpdate | AttributeUpdate[]
  }
  onMissionComplete?: {
    sendCdpEvent?: CdpEventConfig
  }
}

interface GameHooksSectionProps {
  hooks: HooksConfig | undefined
  onChange: (hooks: HooksConfig | undefined) => void
}

export function GameHooksSection({ hooks, onChange }: GameHooksSectionProps) {
  // Parse current state
  const onPlaySuccessEnabled = !!hooks?.onPlaySuccess
  const onMissionCompleteEnabled = !!hooks?.onMissionComplete

  const attributeUpdates: Array<{ field: string; op: 'increment' | 'set'; value: string }> =
    (() => {
      const updates = hooks?.onPlaySuccess?.updateAttributes
      if (!updates) {
        return onPlaySuccessEnabled ? [{ field: '', op: 'increment' as const, value: '1' }] : []
      }
      if (Array.isArray(updates)) {
        return updates.map((u) => ({
          field: u.field,
          op: u.op,
          value: u.value?.toString() || (u.op === 'increment' ? '1' : ''),
        }))
      }
      return [
        {
          field: updates.field,
          op: updates.op,
          value: updates.value?.toString() || (updates.op === 'increment' ? '1' : ''),
        },
      ]
    })()

  const cdpEvent = hooks?.onMissionComplete?.sendCdpEvent || {
    ea: '',
    ec: '',
    portal_id: 0,
    prop_id: 0,
  }

  // Handlers
  const toggleOnPlaySuccess = (enabled: boolean) => {
    if (enabled) {
      onChange({
        ...hooks,
        onPlaySuccess: {
          updateAttributes:
            attributeUpdates.length > 0
              ? attributeUpdates.map((u) => ({
                  field: u.field,
                  op: u.op,
                  value: u.op === 'increment' ? parseInt(u.value) || 1 : u.value,
                }))
              : [{ field: '', op: 'increment', value: 1 }],
        },
      })
    } else {
      onChange({
        ...hooks,
        onPlaySuccess: undefined,
      })
    }
  }

  const toggleOnMissionComplete = (enabled: boolean) => {
    if (enabled) {
      onChange({
        ...hooks,
        onMissionComplete: {
          sendCdpEvent: cdpEvent,
        },
      })
    } else {
      onChange({
        ...hooks,
        onMissionComplete: undefined,
      })
    }
  }

  const updateAttributeUpdates = (
    updates: Array<{ field: string; op: 'increment' | 'set'; value: string }>
  ) => {
    onChange({
      ...hooks,
      onPlaySuccess: {
        updateAttributes:
          updates.length === 0
            ? undefined
            : updates.length === 1
              ? {
                  field: updates[0].field,
                  op: updates[0].op,
                  value: updates[0].op === 'increment' ? parseInt(updates[0].value) || 1 : updates[0].value,
                }
              : updates.map((u) => ({
                  field: u.field,
                  op: u.op,
                  value: u.op === 'increment' ? parseInt(u.value) || 1 : u.value,
                })),
      },
    })
  }

  const updateCdpEvent = (event: Partial<CdpEventConfig>) => {
    onChange({
      ...hooks,
      onMissionComplete: {
        sendCdpEvent: {
          ...cdpEvent,
          ...event,
        },
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lifecycle Hooks (Advanced)</CardTitle>
        <CardDescription>Execute actions at specific points in game lifecycle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* On Play Success Hook */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium">On Play Success</h4>
              <p className="text-xs text-muted-foreground">
                Actions to execute after successful game play
              </p>
            </div>
            <Button
              variant={onPlaySuccessEnabled ? 'secondary' : 'default'}
              size="sm"
              onClick={() => toggleOnPlaySuccess(!onPlaySuccessEnabled)}
            >
              {onPlaySuccessEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>

          {onPlaySuccessEnabled && (
            <div className="space-y-4 rounded-lg border p-4">
              <h5 className="text-sm font-medium">Update User Attributes</h5>
              <div className="space-y-4">
                {attributeUpdates.map((update, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Attribute #{index + 1}
                        </span>
                        {attributeUpdates.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateAttributeUpdates(
                                attributeUpdates.filter((_, i) => i !== index)
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`attr-field-${index}`}>Field Name</Label>
                        <Input
                          id={`attr-field-${index}`}
                          placeholder="e.g., gameScore, totalPlays"
                          value={update.field}
                          onChange={(e) =>
                            updateAttributeUpdates(
                              attributeUpdates.map((u, i) =>
                                i === index ? { ...u, field: e.target.value } : u
                              )
                            )
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`attr-op-${index}`}>Operation</Label>
                          <Select
                            value={update.op}
                            onValueChange={(v) =>
                              updateAttributeUpdates(
                                attributeUpdates.map((u, i) =>
                                  i === index ? { ...u, op: v as 'increment' | 'set' } : u
                                )
                              )
                            }
                          >
                            <SelectTrigger id={`attr-op-${index}`} className='w-full'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="increment">Increment (+)</SelectItem>
                              <SelectItem value="set">Set (=)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`attr-value-${index}`}>Value</Label>
                          <Input
                            id={`attr-value-${index}`}
                            type={update.op === 'increment' ? 'number' : 'text'}
                            placeholder={update.op === 'increment' ? '1' : 'value'}
                            value={update.value}
                            onChange={(e) =>
                              updateAttributeUpdates(
                                attributeUpdates.map((u, i) =>
                                  i === index ? { ...u, value: e.target.value } : u
                                )
                              )
                            }
                          />
                        </div>
                      </div>

                      {index < attributeUpdates.length - 1 && (
                        <div className="border-t border-border/40 pt-1" />
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    // size="sm"
                    onClick={() =>
                      updateAttributeUpdates([
                        ...attributeUpdates,
                        { field: '', op: 'increment', value: '1' },
                      ])
                    }
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Attribute Update
                  </Button>
                </div>
            </div>
          )}
        </div>

        {/* On Mission Complete Hook */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium">On Mission Complete</h4>
              <p className="text-xs text-muted-foreground">
                Actions to execute when any mission is completed
              </p>
            </div>
            <Button
              variant={onMissionCompleteEnabled ? 'secondary' : 'default'}
              size="sm"
              onClick={() => toggleOnMissionComplete(!onMissionCompleteEnabled)}
            >
              {onMissionCompleteEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>

          {onMissionCompleteEnabled && (
            <div className="space-y-4 rounded-lg border p-4">
              <h5 className="text-sm font-medium">Send CDP Event</h5>
              <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cdp-ea">Event Action</Label>
                    <Input
                      id="cdp-ea"
                      placeholder="e.g., complete"
                      value={cdpEvent.ea}
                      onChange={(e) => updateCdpEvent({ ea: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cdp-ec">Event Category</Label>
                    <Input
                      id="cdp-ec"
                      placeholder="e.g., mission"
                      value={cdpEvent.ec}
                      onChange={(e) => updateCdpEvent({ ec: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="cdp-portal">Portal ID</Label>
                      <Input
                        id="cdp-portal"
                        type="number"
                        placeholder="123"
                        value={cdpEvent.portal_id || ''}
                        onChange={(e) =>
                          updateCdpEvent({ portal_id: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cdp-prop">Prop ID</Label>
                      <Input
                        id="cdp-prop"
                        type="number"
                        placeholder="456"
                        value={cdpEvent.prop_id || ''}
                        onChange={(e) => updateCdpEvent({ prop_id: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
