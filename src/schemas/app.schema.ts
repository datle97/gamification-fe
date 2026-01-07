import { z } from 'zod'

export const appSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  portalId: z.coerce.number().int().positive('Portal ID must be a positive number'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  config: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
})

export const createAppSchema = appSchema.omit({ isActive: true })
export const updateAppSchema = appSchema.partial().omit({ appId: true })

export type App = z.infer<typeof appSchema> & {
  createdAt: string
  updatedAt: string
}

export type CreateAppInput = z.infer<typeof createAppSchema>
export type UpdateAppInput = z.infer<typeof updateAppSchema>
