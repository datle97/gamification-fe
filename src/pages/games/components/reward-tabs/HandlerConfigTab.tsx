import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  handlerTypeLabels,
  type ApiRewardConfig,
  type CollectionRewardConfig,
  type HandlerType,
  type JourneyRewardConfig,
  type NoRewardConfig,
  type RewardConfig,
  type ScriptRewardConfig,
  type SystemRewardConfig,
  type TurnRewardConfig,
} from '@/schemas/reward.schema'
import { ApiHandlerForm } from '../reward-forms/ApiHandlerForm'
import { CollectionHandlerForm } from '../reward-forms/CollectionHandlerForm'
import { JourneyHandlerForm } from '../reward-forms/JourneyHandlerForm'
import { NoRewardHandlerForm } from '../reward-forms/NoRewardHandlerForm'
import { ScriptHandlerForm } from '../reward-forms/ScriptHandlerForm'
import { SystemHandlerForm } from '../reward-forms/SystemHandlerForm'
import { TurnHandlerForm } from '../reward-forms/TurnHandlerForm'

const handlerTypes: HandlerType[] = [
  'system',
  'turn',
  'journey',
  'script',
  'no_reward',
  'collection',
  'api',
]

const handlerTypeDescriptions: Record<HandlerType, string> = {
  system: 'Allocate rewards internally without external API calls',
  turn: 'Grant additional game turns to the user',
  journey: 'Integrate with Journey API for reward delivery',
  script: 'Execute custom JavaScript code for dynamic reward logic',
  no_reward: 'Represent a "no win" outcome in the game',
  collection: 'Auto-grant when user completes a collection',
  api: 'Call external API endpoint to process the reward',
}

interface HandlerConfigTabProps {
  handlerType: HandlerType
  config: RewardConfig
  onChange: (config: RewardConfig) => void
  onHandlerTypeChange: (type: HandlerType) => void
}

export function HandlerConfigTab({
  handlerType,
  config,
  onChange,
  onHandlerTypeChange,
}: HandlerConfigTabProps) {
  const updateConfigField = (key: string, value: unknown) => {
    const newConfig = { ...config }
    if (value === undefined || value === '') {
      delete (newConfig as Record<string, unknown>)[key]
    } else {
      ;(newConfig as Record<string, unknown>)[key] = value
    }
    onChange(newConfig)
  }

  return (
    <div className="space-y-6">
      {/* Handler Type Selector */}
      <div className="space-y-2">
        <Label>
          Handler Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={handlerType}
          onValueChange={(value) => onHandlerTypeChange(value as HandlerType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {handlerTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {handlerTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{handlerTypeDescriptions[handlerType]}</p>
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Dynamic Handler Forms */}
      {handlerType === 'system' && (
        <SystemHandlerForm
          config={config as SystemRewardConfig}
          onChange={onChange as (c: SystemRewardConfig) => void}
        />
      )}

      {handlerType === 'turn' && (
        <TurnHandlerForm
          config={config as TurnRewardConfig}
          onChange={onChange as (c: TurnRewardConfig) => void}
        />
      )}

      {handlerType === 'journey' && (
        <JourneyHandlerForm
          config={config as JourneyRewardConfig}
          onChange={onChange as (c: JourneyRewardConfig) => void}
        />
      )}

      {handlerType === 'script' && (
        <ScriptHandlerForm
          config={config as ScriptRewardConfig}
          onChange={onChange as (c: ScriptRewardConfig) => void}
        />
      )}

      {handlerType === 'no_reward' && (
        <NoRewardHandlerForm
          config={config as NoRewardConfig}
          onChange={onChange as (c: NoRewardConfig) => void}
        />
      )}

      {handlerType === 'collection' && (
        <CollectionHandlerForm
          config={config as CollectionRewardConfig}
          onChange={onChange as (c: CollectionRewardConfig) => void}
        />
      )}

      {handlerType === 'api' && (
        <ApiHandlerForm
          config={config as ApiRewardConfig}
          onChange={onChange as (c: ApiRewardConfig) => void}
        />
      )}

      {/* Score Settings - Only for system and journey types */}
      {(handlerType === 'system' || handlerType === 'journey') && (
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-semibold">Score Settings</h4>
          <div className="space-y-2">
            <Label htmlFor="bonus_score">Bonus Score</Label>
            <Input
              id="bonus_score"
              type="number"
              min={0}
              placeholder="0"
              value={config.score || ''}
              onChange={(e) =>
                updateConfigField('score', e.target.value ? parseInt(e.target.value) : undefined)
              }
            />
            <p className="text-xs text-muted-foreground">
              Score to add to user's total when this reward is allocated (default: 0)
            </p>
          </div>
        </div>
      )}

      {/* Fallback to JSON editor for unrecognized types */}
      {!['system', 'turn', 'journey', 'script', 'no_reward', 'collection', 'api'].includes(
        handlerType
      ) && (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              No UI form available for handler type "{handlerType}". Please use the Advanced tab to
              edit configuration JSON.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
