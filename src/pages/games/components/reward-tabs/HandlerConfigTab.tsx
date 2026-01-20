import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { handlerTypeLabels, type HandlerType } from '@/schemas/reward.schema'
import { SystemHandlerForm } from '../reward-forms/SystemHandlerForm'
import { TurnHandlerForm } from '../reward-forms/TurnHandlerForm'
import { JourneyHandlerForm } from '../reward-forms/JourneyHandlerForm'
import { ScriptHandlerForm } from '../reward-forms/ScriptHandlerForm'
import { NoRewardHandlerForm } from '../reward-forms/NoRewardHandlerForm'
import { CollectionHandlerForm } from '../reward-forms/CollectionHandlerForm'
import { ApiHandlerForm } from '../reward-forms/ApiHandlerForm'

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
  config: string
  onChange: (config: string) => void
  onHandlerTypeChange: (type: HandlerType) => void
}

export function HandlerConfigTab({
  handlerType,
  config,
  onChange,
  onHandlerTypeChange,
}: HandlerConfigTabProps) {
  return (
    <div className="space-y-6">
      {/* Handler Type Selector */}
      <div className="space-y-2">
        <Label>
          Handler Type <span className="text-destructive">*</span>
        </Label>
        <Select value={handlerType} onValueChange={(value) => onHandlerTypeChange(value as HandlerType)}>
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
      {handlerType === 'system' && <SystemHandlerForm config={config} onChange={onChange} />}

      {handlerType === 'turn' && <TurnHandlerForm config={config} onChange={onChange} />}

      {handlerType === 'journey' && <JourneyHandlerForm config={config} onChange={onChange} />}

      {handlerType === 'script' && <ScriptHandlerForm config={config} onChange={onChange} />}

      {handlerType === 'no_reward' && <NoRewardHandlerForm config={config} onChange={onChange} />}

      {handlerType === 'collection' && <CollectionHandlerForm config={config} onChange={onChange} />}

      {handlerType === 'api' && <ApiHandlerForm config={config} onChange={onChange} />}

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
