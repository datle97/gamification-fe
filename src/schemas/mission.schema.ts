import { z } from 'zod'

// Enums
export const missionTypeEnum = z.enum(['single', 'count', 'streak', 'cumulative'])
export const triggerEventEnum = z.enum([
  'user:login',
  'zma:checkin',
  'game:play',
  'game:share',
  'share:reward',
  'share:position',
  'bill:payment',
  'booking:create',
  'coupon:redeem',
  'tier:upgrade',
  'points:earn',
])
export const missionPeriodEnum = z.enum([
  'daily',
  'weekly',
  'weekly_mon',
  'weekly_sun',
  'weekly_fri',
  'monthly',
  'all_time',
])
export const missionRewardTypeEnum = z.enum(['turns', 'score'])

export type MissionType = z.infer<typeof missionTypeEnum>
export type TriggerEvent = z.infer<typeof triggerEventEnum>
export type MissionPeriod = z.infer<typeof missionPeriodEnum>
export type MissionRewardType = z.infer<typeof missionRewardTypeEnum>

// Labels for UI display
export const missionTypeLabels: Record<MissionType, string> = {
  single: 'Single',
  count: 'Count',
  streak: 'Streak',
  cumulative: 'Cumulative',
}

export const missionPeriodLabels: Record<MissionPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  weekly_mon: 'Weekly (Monday)',
  weekly_sun: 'Weekly (Sunday)',
  weekly_fri: 'Weekly (Friday)',
  monthly: 'Monthly',
  all_time: 'All Time',
}

export const missionRewardTypeLabels: Record<MissionRewardType, string> = {
  turns: 'Turns',
  score: 'Score',
}

export const triggerEventLabels: Record<TriggerEvent, string> = {
  'user:login': 'User Login',
  'zma:checkin': 'ZMA Checkin',
  'game:play': 'Game Play',
  'game:share': 'Game Share',
  'share:reward': 'Share Reward',
  'share:position': 'Share Position',
  'bill:payment': 'Bill Payment',
  'booking:create': 'Booking Create',
  'coupon:redeem': 'Coupon Redeem',
  'tier:upgrade': 'Tier Upgrade',
  'points:earn': 'Points Earn',
}

// Mission conditions (optional JSONB field)
export const missionConditionsSchema = z.record(z.string(), z.any()).optional()

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

// Mission schema
export const missionSchema = z.object({
  missionId: z.string().uuid(),
  gameId: z.string().uuid(),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Code must be lowercase alphanumeric with dashes'),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  displayOrder: z.number().default(0),
  triggerEvent: triggerEventEnum,
  missionType: missionTypeEnum,
  missionPeriod: missionPeriodEnum,
  targetValue: z.number().min(1).default(1),
  maxCompletions: z.number().min(1).nullable().optional(),
  conditions: missionConditionsSchema,
  rewardType: missionRewardTypeEnum.default('turns'),
  rewardValue: z.number().min(0).default(0),
  rewardExpirationConfig: expirationConfigSchema,
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  allowFeTrigger: z.boolean().default(true),
})

export const createMissionSchema = missionSchema.omit({ missionId: true })
export const updateMissionSchema = missionSchema.partial().omit({ missionId: true, gameId: true })

export type Mission = z.infer<typeof missionSchema> & {
  createdAt: string
  updatedAt: string
  game?: {
    gameId: string
    code: string
    name: string
  }
}

export type CreateMissionInput = z.infer<typeof createMissionSchema>
export type UpdateMissionInput = z.infer<typeof updateMissionSchema>
