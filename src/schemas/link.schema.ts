import { z } from 'zod'
import type { App } from './app.schema'
import type { Game } from './game.schema'

export const linkStatusEnum = z.enum(['draft', 'active', 'paused', 'ended'])

export const linkSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  gameId: z.string().uuid('Game ID must be a valid UUID'),
  status: linkStatusEnum,
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  timezone: z.string().optional(),
  config: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const createLinkSchema = linkSchema
export const updateLinkSchema = linkSchema.partial().required({ appId: true, gameId: true })

export type LinkStatus = z.infer<typeof linkStatusEnum>

export type Link = z.infer<typeof linkSchema> & {
  createdAt: string
  updatedAt: string
  app?: App
  game?: Game
}

export type CreateLinkInput = z.infer<typeof createLinkSchema>
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>
