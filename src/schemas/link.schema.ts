import { z } from 'zod'
import type { App } from './app.schema'
import type { Game } from './game.schema'

// AppGame is now a thin mapping table - just appId + gameId
export const linkSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  gameId: z.string().uuid('Game ID must be a valid UUID'),
})

export const createLinkSchema = linkSchema
// No update schema needed - it's just a mapping, either exists or not

export type Link = z.infer<typeof linkSchema> & {
  createdAt: string
  app?: App
  game?: Game
}

export type CreateLinkInput = z.infer<typeof createLinkSchema>
