import { z } from 'zod'

export const apiKeySchema = z.object({
  keyId: z.string(),
  name: z.string().max(255).optional(),
  appId: z.string(),
  apiKeyPrefix: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const createApiKeySchema = apiKeySchema.pick({
  appId: true,
  name: true,
})

export const updateApiKeySchema = z.object({
  name: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
})

export type ApiKey = z.infer<typeof apiKeySchema> & {
  createdAt: string
  updatedAt: string
}

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>

export interface ApiKeyWithRawKey extends ApiKey {
  apiKey: string
}
