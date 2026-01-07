import { z } from 'zod'

export const gameTypeEnum = z.enum(['spin', 'scratch', 'quiz', 'puzzle', 'match', 'lottery'])

export const gameSchema = z.object({
  gameId: z.string().uuid(),
  code: z.string().min(1, 'Code is required').regex(/^[a-z0-9-]+$/, 'Code must be lowercase alphanumeric with dashes'),
  name: z.string().min(1, 'Name is required'),
  type: gameTypeEnum.optional(),
  description: z.string().optional(),
  templateUrl: z.string().url().optional().or(z.literal('')),
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
