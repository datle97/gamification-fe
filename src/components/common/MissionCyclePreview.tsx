import { getMissionCycleInfo, type MissionFormData } from '@/lib/mission-cycle'
import { cn } from '@/lib/utils'
import { AlertTriangle, Check, Gift, Play, RefreshCw, Target, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'

interface MissionCyclePreviewProps {
  formData: MissionFormData
  className?: string
}

const stepIcons = {
  Trigger: Play,
  Track: TrendingUp,
  Complete: Target,
  Reward: Gift,
  Reset: RefreshCw,
}

export function MissionCyclePreview({ formData, className }: MissionCyclePreviewProps) {
  const cycleInfo = useMemo(() => getMissionCycleInfo(formData), [formData])

  return (
    <div className={cn('space-y-4', className)}>
      <h4 className="text-sm font-medium">Mission Cycle</h4>

      {/* Stepper */}
      <div className="space-y-0">
        {cycleInfo.steps.map((step, index) => {
          const Icon = stepIcons[step.title as keyof typeof stepIcons] || Check
          const isLast = index === cycleInfo.steps.length - 1

          return (
            <div key={step.title} className="flex gap-3">
              {/* Icon + Line */}
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {!isLast && <div className="w-px flex-1 bg-border min-h-4" />}
              </div>

              {/* Content */}
              <div className={cn('pb-4', isLast && 'pb-0')}>
                <div className="text-sm font-medium leading-7">{step.title}</div>
                <div className="text-sm text-muted-foreground">{step.description}</div>
                {step.details && step.details.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {step.details.map((detail, i) => (
                      <li key={i} className="text-xs text-muted-foreground/80 flex items-start gap-1.5">
                        <span className="text-muted-foreground/50 mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="text-xs font-medium text-muted-foreground mb-1">Summary</div>
        <div className="text-sm">{cycleInfo.summary}</div>
      </div>

      {/* Warnings */}
      {cycleInfo.warnings.length > 0 && (
        <div className="space-y-2">
          {cycleInfo.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
