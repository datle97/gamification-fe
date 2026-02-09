import { z } from 'zod'

export const portalSchema = z.object({
  portalId: z.coerce.number().int(),
  name: z.string().min(1, 'Name is required').max(255),
  timezone: z.string().max(50).default('Asia/Ho_Chi_Minh'),
  config: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().default(true),
})

export const createPortalSchema = portalSchema.pick({
  portalId: true,
  name: true,
  timezone: true,
  config: true,
  metadata: true,
})

export const updatePortalSchema = z.object({
  name: z.string().max(255).optional(),
  timezone: z.string().max(50).optional(),
  config: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
})

export type Portal = z.infer<typeof portalSchema> & {
  createdAt: string
  updatedAt: string
}

export type CreatePortalInput = z.infer<typeof createPortalSchema>
export type UpdatePortalInput = z.infer<typeof updatePortalSchema>
