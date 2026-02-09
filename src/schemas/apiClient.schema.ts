import { z } from 'zod'

export const apiClientSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1, 'Name is required'),
  appId: z.string(),
  apiKeyPrefix: z.string().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().default(true),
})

export const createApiClientSchema = apiClientSchema.pick({
  name: true,
  appId: true,
  description: true,
  metadata: true,
})

export const updateApiClientSchema = z.object({
  name: z.string().max(255).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
})

export type ApiClient = z.infer<typeof apiClientSchema> & {
  createdAt: string
  updatedAt: string
}

export type CreateApiClientInput = z.infer<typeof createApiClientSchema>
export type UpdateApiClientInput = z.infer<typeof updateApiClientSchema>

export interface ApiClientWithApiKey extends ApiClient {
  apiKey: string
}
