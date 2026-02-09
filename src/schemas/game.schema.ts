import { z } from 'zod'

// Enums
export const gameStatusEnum = z.enum(['draft', 'active', 'paused', 'ended'])
export const gameTypeEnum = z.enum([
  'spin',
  'scratch',
  'quiz',
  'puzzle',
  'match',
  'lottery',
  'catch',
])
export const periodTypeEnum = z.enum([
  'daily',
  'weekly',
  'weekly_mon',
  'weekly_tue',
  'weekly_wed',
  'weekly_thu',
  'weekly_fri',
  'weekly_sat',
  'weekly_sun',
  'monthly',
  'all_time',
])

export type GameStatus = z.infer<typeof gameStatusEnum>
export type GameType = z.infer<typeof gameTypeEnum>
export type PeriodType = z.infer<typeof periodTypeEnum>

// Labels and variants for UI display
export const gameTypeLabels: Record<GameType, string> = {
  spin: 'Spin Wheel',
  scratch: 'Scratch Card',
  quiz: 'Quiz',
  puzzle: 'Puzzle',
  match: 'Match Game',
  lottery: 'Lottery',
  catch: 'Catch',
}

export const gameStatusLabels: Record<GameStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  ended: 'Ended',
}

export const gameStatusVariants: Record<
  GameStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  active: 'default',
  draft: 'outline',
  paused: 'secondary',
  ended: 'destructive',
}

export const periodTypeLabels: Record<PeriodType, string> = {
  daily: 'Daily',
  weekly: 'Weekly (Mon - Sun)',
  weekly_mon: 'Weekly (Mon - Sun)',
  weekly_tue: 'Weekly (Tue - Mon)',
  weekly_wed: 'Weekly (Wed - Tue)',
  weekly_thu: 'Weekly (Thu - Wed)',
  weekly_fri: 'Weekly (Fri - Thu)',
  weekly_sat: 'Weekly (Sat - Fri)',
  weekly_sun: 'Weekly (Sun - Sat)',
  monthly: 'Monthly',
  all_time: 'All-Time',
}

// Leaderboard config
export const leaderboardConfigSchema = z.object({
  periodType: periodTypeEnum,
  limit: z.number().optional(),
  uniqueTopN: z.number().optional(),
})

// Reward selection config
export const rewardSelectionConfigSchema = z.object({
  name: z.string(),
  filter: z.object({
    field: z.string(),
    value: z.string(),
  }),
})

// Hooks config
export const attributeUpdateSchema = z.object({
  field: z.string(),
  op: z.enum(['increment', 'set']),
  value: z.any().optional(),
})

export const cdpEventConfigSchema = z.object({
  ea: z.string(),
  ec: z.string(),
  portal_id: z.number(),
  prop_id: z.number(),
})

export const hooksConfigSchema = z.object({
  onPlaySuccess: z
    .object({
      updateAttributes: z.union([attributeUpdateSchema, z.array(attributeUpdateSchema)]).optional(),
    })
    .optional(),
  onMissionComplete: z
    .object({
      sendCdpEvent: cdpEventConfigSchema.optional(),
    })
    .optional(),
})

// Restrictions config
export const restrictionsConfigSchema = z.object({
  blacklist: z
    .object({
      phones: z.array(z.string()).optional(),
      message: z.string().optional(),
    })
    .optional(),
  whitelist: z
    .object({
      phones: z.array(z.string()).optional(),
      message: z.string().optional(),
    })
    .optional(),
})

// Game config
export const gameConfigSchema = z.object({
  leaderboard: leaderboardConfigSchema.optional(),
  playScore: z.number().optional(),
  rewardSelections: z.array(rewardSelectionConfigSchema).optional(),
  hooks: hooksConfigSchema.optional(),
  restrictions: restrictionsConfigSchema.optional(),
})

export type GameConfig = z.infer<typeof gameConfigSchema>

// Game schema
export const gameSchema = z.object({
  gameId: z.string().uuid(),
  code: z
    .string()
    .min(1, 'Code is required')
    .regex(/^[a-z0-9-]+$/, 'Code must be lowercase alphanumeric with dashes'),
  name: z.string().min(1, 'Name is required'),
  type: gameTypeEnum.optional(),
  description: z.string().optional(),
  iconUrl: z.string().url().optional().or(z.literal('')),
  templateUrl: z.string().url().optional().or(z.literal('')),
  status: gameStatusEnum.default('draft'),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  timezone: z.string().default('Asia/Ho_Chi_Minh'),
  config: gameConfigSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const createGameSchema = gameSchema.omit({ gameId: true })
export const updateGameSchema = gameSchema.partial().omit({ gameId: true })

export const cloneGameSchema = z.object({
  newCode: z
    .string()
    .min(1, 'Code is required')
    .regex(/^[a-z0-9-]+$/, 'Code must be lowercase alphanumeric with dashes'),
  newName: z.string().min(1, 'Name is required'),
  includeMissions: z.boolean().optional(),
  includeRewards: z.boolean().optional(),
})

export type Game = z.infer<typeof gameSchema> & {
  createdAt: string
  updatedAt: string
}

export type CreateGameInput = z.infer<typeof createGameSchema>
export type UpdateGameInput = z.infer<typeof updateGameSchema>
export type CloneGameInput = z.infer<typeof cloneGameSchema>
