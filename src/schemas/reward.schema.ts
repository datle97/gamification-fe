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

// Expiration config
export const expirationConfigSchema = z
  .object({
    mode: z.enum(['permanent', 'ttl', 'fixed', 'anchor']),
    ttlDays: z.number().optional(),
    fixedDate: z.string().optional(),
    anchorPeriod: z.string().optional(),
    anchorOffset: z.number().optional(),
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

// Reward schema
export const rewardSchema = z.object({
  rewardId: z.string().uuid(),
  gameId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  imageUrl: z.string().url().optional().or(z.literal('')).nullable(),
  description: z.string().max(500).optional().nullable(),
  rewardType: rewardCategoryEnum.optional().nullable(),
  handlerType: handlerTypeEnum,
  config: z.record(z.string(), z.any()).default({}),
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
  // Complex nested conditions - use Advanced tab
  requiresUserAttributes?: Record<string, unknown>
  requiresClientInput?: Record<string, unknown>
  mode?: 'AND' | 'OR'
}
