import { z } from 'zod'

// Enums
export const gameStatusEnum = z.enum(['draft', 'active', 'paused', 'ended'])
export const gameTypeEnum = z.enum(['spin', 'scratch', 'quiz', 'puzzle', 'match', 'lottery'])
export const periodTypeEnum = z.enum(['daily', 'weekly', 'weekly_mon', 'weekly_sun', 'weekly_fri', 'monthly', 'all_time'])

export type GameStatus = z.infer<typeof gameStatusEnum>
export type GameType = z.infer<typeof gameTypeEnum>
export type PeriodType = z.infer<typeof periodTypeEnum>

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

export const hooksConfigSchema = z.object({
  onPlaySuccess: z.object({
    updateAttributes: z.union([attributeUpdateSchema, z.array(attributeUpdateSchema)]).optional(),
  }).optional(),
})

// Game config
export const gameConfigSchema = z.object({
  leaderboard: leaderboardConfigSchema.optional(),
  playScore: z.number().optional(),
  rewardSelections: z.array(rewardSelectionConfigSchema).optional(),
  hooks: hooksConfigSchema.optional(),
})

export type GameConfig = z.infer<typeof gameConfigSchema>

// Game schema
export const gameSchema = z.object({
  gameId: z.string().uuid(),
  code: z.string().min(1, 'Code is required').regex(/^[a-z0-9-]+$/, 'Code must be lowercase alphanumeric with dashes'),
  name: z.string().min(1, 'Name is required'),
  type: gameTypeEnum.optional(),
  description: z.string().optional(),
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

export type Game = z.infer<typeof gameSchema> & {
  createdAt: string
  updatedAt: string
}

export type CreateGameInput = z.infer<typeof createGameSchema>
export type UpdateGameInput = z.infer<typeof updateGameSchema>
