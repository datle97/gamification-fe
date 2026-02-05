import type { ExpirationConfig } from '@/schemas/reward.schema'
import {
  missionPeriodLabels,
  missionRewardTypeLabels,
  triggerEventLabels,
  type MissionPeriod,
  type MissionRewardType,
  type MissionType,
  type TriggerEvent,
} from '@/schemas/mission.schema'

export interface MissionFormData {
  triggerEvent: string
  missionType: MissionType
  missionPeriod: MissionPeriod
  targetValue: number
  maxCompletions: number | null
  rewardType: MissionRewardType
  rewardValue: number
  rewardExpirationConfig: ExpirationConfig | null
  allowFeTrigger: boolean
  conditions: string
}

export interface CycleStep {
  title: string
  description: string
  details?: string[]
}

export interface MissionCycleInfo {
  steps: CycleStep[]
  warnings: string[]
  summary: string
}

function getTriggerLabel(event: string): string {
  return triggerEventLabels[event as TriggerEvent] || event
}

function getPeriodResetDescription(period: MissionPeriod): string {
  switch (period) {
    case 'daily':
      return 'Every day at midnight'
    case 'weekly':
    case 'weekly_mon':
      return 'Every Monday'
    case 'weekly_sun':
      return 'Every Sunday'
    case 'weekly_fri':
      return 'Every Friday'
    case 'monthly':
      return 'First day of each month'
    case 'all_time':
      return 'Never (lifetime)'
  }
}

function getProgressDescription(type: MissionType, targetValue: number): { desc: string; details: string[] } {
  switch (type) {
    case 'single':
      return {
        desc: 'Complete immediately on trigger',
        details: ['One trigger = mission complete'],
      }
    case 'count':
      return {
        desc: `Count ${targetValue} different days`,
        details: ['Progress +1 per day (max once per day)', 'Days do not need to be consecutive'],
      }
    case 'streak':
      return {
        desc: `${targetValue} consecutive days`,
        details: [
          'Progress +1 if triggered on consecutive day',
          'Missing a day resets progress to 0',
          'Must not skip any days',
        ],
      }
    case 'cumulative':
      return {
        desc: `Accumulate ${targetValue} total`,
        details: ['Progress += event value', 'Values accumulate over the period'],
      }
  }
}

function getCompletionBehavior(maxCompletions: number | null, period: MissionPeriod): string {
  if (maxCompletions === null) {
    return 'Unlimited (auto-resets after each completion)'
  }
  if (maxCompletions === 1) {
    if (period === 'all_time') {
      return 'Once ever (permanent)'
    }
    return `Once per ${missionPeriodLabels[period].toLowerCase()}`
  }
  if (period === 'all_time') {
    return `${maxCompletions} times ever (permanent)`
  }
  return `Up to ${maxCompletions} times per ${missionPeriodLabels[period].toLowerCase()}`
}

function getRewardDescription(
  type: MissionRewardType,
  value: number,
  expConfig: ExpirationConfig | null
): { desc: string; details: string[] } {
  const rewardLabel = missionRewardTypeLabels[type]
  const details: string[] = []

  if (type === 'turns' && expConfig) {
    switch (expConfig.mode) {
      case 'permanent':
        details.push('Turns never expire')
        break
      case 'ttl':
        details.push(`Expires ${expConfig.value} ${expConfig.unit}(s) after grant`)
        break
      case 'fixed':
        details.push(`Expires on ${expConfig.date}`)
        break
      case 'anchor':
        details.push(`Expires at end of ${expConfig.unit}`)
        break
    }
  } else if (type === 'score') {
    details.push('Score is permanent (all-time leaderboard)')
  }

  return {
    desc: `${value} ${rewardLabel.toLowerCase()}`,
    details,
  }
}

function getResetBehavior(maxCompletions: number | null, period: MissionPeriod): string {
  if (maxCompletions === null) {
    return 'Auto-resets immediately after completion'
  }
  if (period === 'all_time') {
    return 'Stays completed forever'
  }
  return `Resets at period boundary (${getPeriodResetDescription(period).toLowerCase()})`
}

export function getMissionCycleInfo(data: MissionFormData): MissionCycleInfo {
  const warnings: string[] = []

  // Validate combinations
  if (data.missionType === 'streak' && data.missionPeriod === 'daily' && data.targetValue > 1) {
    warnings.push(
      `Streak of ${data.targetValue} days with daily reset is impossible - period resets before streak can complete`
    )
  }

  if (data.missionType === 'single' && data.targetValue > 1) {
    warnings.push('Single type ignores target value - it always completes on first trigger')
  }

  if (data.missionType === 'count') {
    const periodDays =
      data.missionPeriod === 'daily'
        ? 1
        : data.missionPeriod.startsWith('weekly')
          ? 7
          : data.missionPeriod === 'monthly'
            ? 28
            : Infinity
    if (data.targetValue > periodDays && periodDays !== Infinity) {
      warnings.push(
        `Target of ${data.targetValue} days exceeds period length (~${periodDays} days) - mission may be impossible`
      )
    }
  }

  if (data.maxCompletions === null && data.missionPeriod === 'all_time') {
    warnings.push('Unlimited completions with all-time period means mission repeats infinitely with no boundary')
  }

  if (!data.allowFeTrigger && ['user:login', 'game:play', 'zma:checkin'].includes(data.triggerEvent)) {
    warnings.push(
      `FE trigger disabled but "${getTriggerLabel(data.triggerEvent)}" is typically a user-initiated action`
    )
  }

  // Build steps
  const progressInfo = getProgressDescription(data.missionType, data.targetValue)
  const rewardInfo = getRewardDescription(data.rewardType, data.rewardValue, data.rewardExpirationConfig)

  const steps: CycleStep[] = [
    {
      title: 'Trigger',
      description: getTriggerLabel(data.triggerEvent),
      details: [
        data.allowFeTrigger ? 'Can be triggered by frontend' : 'Backend-only (FE trigger disabled)',
        ...(data.conditions ? ['Has conditional filters'] : []),
      ],
    },
    {
      title: 'Track',
      description: progressInfo.desc,
      details: progressInfo.details,
    },
    {
      title: 'Complete',
      description:
        data.missionType === 'single' ? 'On first trigger' : `When target reached (${data.targetValue})`,
      details: [getCompletionBehavior(data.maxCompletions, data.missionPeriod)],
    },
    {
      title: 'Reward',
      description: rewardInfo.desc,
      details: rewardInfo.details,
    },
    {
      title: 'Reset',
      description: getResetBehavior(data.maxCompletions, data.missionPeriod),
      details: data.missionPeriod !== 'all_time' ? [`Period: ${getPeriodResetDescription(data.missionPeriod)}`] : [],
    },
  ]

  // Generate summary
  const periodText =
    data.missionPeriod === 'all_time' ? 'Over lifetime' : `Every ${missionPeriodLabels[data.missionPeriod].toLowerCase()}`
  const actionText = getTriggerLabel(data.triggerEvent).toLowerCase()
  const trackText =
    data.missionType === 'single'
      ? 'once'
      : data.missionType === 'count'
        ? `on ${data.targetValue} different days`
        : data.missionType === 'streak'
          ? `for ${data.targetValue} consecutive days`
          : `until ${data.targetValue} accumulated`
  const rewardText = `${data.rewardValue} ${missionRewardTypeLabels[data.rewardType].toLowerCase()}`
  const repeatText =
    data.maxCompletions === null
      ? 'repeatable'
      : data.maxCompletions === 1
        ? 'once only'
        : `up to ${data.maxCompletions}×`

  const summary = `${periodText}, user ${actionText} ${trackText} → earns ${rewardText} (${repeatText})`

  return { steps, warnings, summary }
}
