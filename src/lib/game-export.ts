import type { GameConfig, GameStatus } from '@/schemas/game.schema'
import type {
  MissionPeriod,
  MissionRewardType,
  MissionType,
  TriggerEvent,
} from '@/schemas/mission.schema'
import type {
  ExpirationConfig,
  HandlerType,
  RewardCategory,
  RewardConditions,
} from '@/schemas/reward.schema'
import type { Conditions } from '@/types/conditions'

/**
 * Game Export Schema
 * Used for exporting game configuration to JSON file
 * for deployment between environments (staging → production)
 */
export interface GameExport {
  version: string
  exportedAt: string
  game: GameExportData
  missions: MissionExportData[]
  rewards: RewardExportData[]
}

// Game data for export
export interface GameExportData {
  gameId: string
  code: string
  name: string
  type?: string
  status: GameStatus
  description?: string
  templateUrl?: string
  timezone: string
  config: GameConfig
  metadata?: Record<string, unknown>
  startAt?: string | null
  endAt?: string | null
}

// Mission data for export
export interface MissionExportData {
  missionId: string
  code: string
  name: string
  description?: string
  imageUrl?: string
  displayOrder: number
  triggerEvent: TriggerEvent
  missionType: MissionType
  missionPeriod: MissionPeriod
  targetValue: number
  maxCompletions?: number
  conditions?: Conditions | null
  rewardType: MissionRewardType
  rewardValue: number
  rewardExpirationConfig?: ExpirationConfig
  startDate?: string | null
  endDate?: string | null
  isActive: boolean
  allowFeTrigger: boolean
}

// Reward data for export
export interface RewardExportData {
  rewardId: string
  name: string
  imageUrl?: string | null
  description?: string | null
  rewardType?: RewardCategory | null
  handlerType: HandlerType
  config: Record<string, unknown>
  probability: number
  quota: number | null
  displayOrder: number
  fallbackRewardId: string | null
  isActive: boolean
  conditions?: RewardConditions | null
  shareConfig?: {
    enabled: boolean
    allowedTypes?: ('phone' | 'public')[]
    conditions?: Record<string, unknown>
  } | null
  expirationConfig?: ExpirationConfig | null
  metadata?: Record<string, unknown> | null
}

/**
 * Download game export as JSON file
 * Filename format: game-{code}-YYYYMMDD.json
 */
export function downloadGameExport(gameExport: GameExport): void {
  const json = JSON.stringify(gameExport, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // Format date as YYYYMMDD
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')

  const a = document.createElement('a')
  a.href = url
  a.download = `game-${gameExport.game.code}-${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
