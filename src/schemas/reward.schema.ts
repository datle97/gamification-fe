import type { Conditions } from '@/types/conditions'
import { z } from 'zod'

// Enums
export const rewardCategoryEnum = z.enum([
  'voucher',
  'collectable',
  'coins',
  'points',
  'turn',
  'physical',
  'no_reward',
  'other',
])

export const handlerTypeEnum = z.enum([
  'api',
  'system',
  'turn',
  'no_reward',
  'collection',
  'script',
  'journey',
])

export type RewardCategory = z.infer<typeof rewardCategoryEnum>
export type HandlerType = z.infer<typeof handlerTypeEnum>

// Labels for UI display
export const rewardCategoryLabels: Record<RewardCategory, string> = {
  voucher: 'Voucher',
  collectable: 'Collectable',
  coins: 'Coins',
  points: 'Points',
  turn: 'Turn',
  physical: 'Physical',
  no_reward: 'No Reward',
  other: 'Other',
}

export const handlerTypeLabels: Record<HandlerType, string> = {
  api: 'API',
  system: 'System',
  turn: 'Turn',
  no_reward: 'No Reward',
  collection: 'Collection',
  script: 'Script',
  journey: 'Journey',
}

// Expiration config (matches backend ExpirationConfig type)
export const expirationConfigSchema = z
  .object({
    mode: z.enum(['permanent', 'ttl', 'fixed', 'anchor']),
    value: z.number().optional(),
    unit: z.enum(['second', 'minute', 'hour', 'day', 'week', 'month', 'year']).optional(),
    date: z.string().optional(),
  })
  .optional()
  .nullable()

// Share config
export const shareConfigSchema = z
  .object({
    enabled: z.boolean().default(false),
    allowedTypes: z.array(z.enum(['phone', 'public'])).optional(),
    conditions: z.record(z.string(), z.any()).optional(),
  })
  .optional()
  .nullable()

// Reward Config Types
export const rewardPersistToEnum = z.enum(['vouchers', 'user_rewards'])
export type RewardPersistTo = z.infer<typeof rewardPersistToEnum>

// Base config schema (shared fields)
const baseRewardConfigSchema = z.object({
  extra: z.record(z.string(), z.unknown()).optional(),
  tag: z.string().optional(),
  score: z.number().optional(),
})

// Individual config schemas
export const noRewardConfigSchema = baseRewardConfigSchema.extend({
  type: z.literal('no_reward'),
  message: z.string().optional(),
})

export const turnRewardConfigSchema = baseRewardConfigSchema.extend({
  type: z.literal('turn'),
  amount: z.number(),
  expirationConfig: expirationConfigSchema.optional(),
})

export const systemRewardConfigSchema = baseRewardConfigSchema.extend({
  type: z.literal('system'),
})

export const apiRewardConfigSchema = baseRewardConfigSchema.extend({
  type: z.literal('api'),
  provider: z.string(),
  persistTo: rewardPersistToEnum,
  api: z.object({
    url: z.string(),
    method: z.enum(['GET', 'POST']),
    headers: z.record(z.string(), z.string()).optional(),
    params: z.record(z.string(), z.unknown()).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    timeout: z.number().optional(),
  }),
  responseMapping: z.object({
    fields: z.array(z.object({ target: z.string(), expr: z.string() })).optional(),
    successCondition: z.string().optional(),
    fallbackCondition: z.string().optional(),
    noRewardCondition: z.string().optional(),
  }),
  retry: z
    .object({
      maxRetries: z.number().optional(),
      retryDelay: z.number().optional(),
    })
    .optional(),
})

export const scriptRewardConfigSchema = baseRewardConfigSchema.extend({
  type: z.literal('script'),
  code: z.string(),
  persistTo: rewardPersistToEnum.optional(),
})

export const journeyRewardConfigSchema = baseRewardConfigSchema.extend({
  type: z.literal('journey'),
  journeyId: z.number(),
  portalId: z.number(),
  propId: z.string(),
  campaignType: z.string(),
  rollPercentage: z.boolean().optional(),
  persistTo: rewardPersistToEnum.optional(),
})

export const collectionRewardConfigSchema = baseRewardConfigSchema.extend({
  type: z.literal('collection'),
})

// Combined discriminated union
export const rewardConfigSchema = z.discriminatedUnion('type', [
  noRewardConfigSchema,
  turnRewardConfigSchema,
  systemRewardConfigSchema,
  apiRewardConfigSchema,
  scriptRewardConfigSchema,
  journeyRewardConfigSchema,
  collectionRewardConfigSchema,
])

// Type exports (inferred from Zod schemas)
export type NoRewardConfig = z.infer<typeof noRewardConfigSchema>
export type TurnRewardConfig = z.infer<typeof turnRewardConfigSchema>
export type SystemRewardConfig = z.infer<typeof systemRewardConfigSchema>
export type ApiRewardConfig = z.infer<typeof apiRewardConfigSchema>
export type ScriptRewardConfig = z.infer<typeof scriptRewardConfigSchema>
export type JourneyRewardConfig = z.infer<typeof journeyRewardConfigSchema>
export type CollectionRewardConfig = z.infer<typeof collectionRewardConfigSchema>
export type RewardConfig = z.infer<typeof rewardConfigSchema>

/** Base interface for all reward configs */
export interface BaseRewardConfig {
  /** Extra metadata to save with reward */
  extra?: Record<string, unknown>
  /** Tag for reward grouping */
  tag?: string
  /** Bonus score when reward is allocated */
  score?: number
}

// Reward schema
export const rewardSchema = z.object({
  rewardId: z.string().uuid(),
  gameId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  imageUrl: z.string().url().optional().or(z.literal('')).nullable(),
  description: z.string().max(500).optional().nullable(),
  rewardType: rewardCategoryEnum.optional().nullable(),
  handlerType: handlerTypeEnum,
  config: rewardConfigSchema,
  probability: z.number().min(0).max(100).default(0),
  quota: z.number().min(0).nullable().optional(),
  quotaUsed: z.number().default(0),
  displayOrder: z.number().default(0),
  fallbackRewardId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  conditions: z.record(z.string(), z.any()).optional().nullable(),
  shareConfig: shareConfigSchema,
  expirationConfig: expirationConfigSchema,
  metadata: z.record(z.string(), z.any()).optional().nullable(),
})

export const createRewardSchema = rewardSchema.omit({
  rewardId: true,
  quotaUsed: true,
})

export const updateRewardSchema = rewardSchema
  .partial()
  .omit({ rewardId: true, gameId: true, quotaUsed: true })

export type Reward = z.infer<typeof rewardSchema> & {
  createdAt: string
  updatedAt: string
  game?: {
    gameId: string
    code: string
    name: string
  }
}

export type CreateRewardInput = z.infer<typeof createRewardSchema>
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>

// Reward Conditions types
export interface RequiresRewardsCondition {
  rewardIds?: string[]
  count?: number
  mode?: 'all' | 'any'
  excludeRewards?: string[]
}

export interface TimeWindowCondition {
  startDate?: Date | string
  endDate?: Date | string
  daysOfWeek?: number[]
  hours?: [number, number]
}

export interface UniquenessCondition {
  maxPerUser?: number
}

export interface UserSegmentCondition {
  userIds?: string[]
  phoneNumbers?: string[]
  excludeUserIds?: string[]
  excludePhoneNumbers?: string[]
}

export interface NumericCondition {
  op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
  value: number
}

export interface RewardConditions {
  requiresRewards?: RequiresRewardsCondition | RequiresRewardsCondition[]
  timeWindow?: TimeWindowCondition
  uniqueness?: UniquenessCondition
  requiresUserSegment?: UserSegmentCondition
  requiresLeaderboardScore?: NumericCondition
  requiresUserAttributes?: Conditions
  requiresClientInput?: Conditions
  mode?: 'AND' | 'OR'
}

// Expiration Config types
export type ExpirationUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

export interface ExpirationConfig {
  mode: 'permanent' | 'ttl' | 'fixed' | 'anchor'
  value?: number
  unit?: ExpirationUnit
  date?: string
}

// Reward Distribution Analytics
export interface RewardDistribution {
  rewardId: string
  name: string
  imageUrl: string | null
  rewardType: string | null
  probability: number
  quota: number | null
  quotaUsed: number
  expectedCount: number
  actualCount: number
  deviation: number
  status: 'ok' | 'over' | 'under'
}
