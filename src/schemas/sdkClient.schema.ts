import { z } from 'zod'

export const sdkClientSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1, 'Name is required'),
  portalId: z.coerce.number().int(),
  apiKeyPrefix: z.string().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().default(true),
})

export const createSdkClientSchema = sdkClientSchema.pick({
  name: true,
  portalId: true,
  description: true,
  metadata: true,
})

export const updateSdkClientSchema = z.object({
  name: z.string().max(255).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
})

export type SdkClient = z.infer<typeof sdkClientSchema> & {
  createdAt: string
  updatedAt: string
}

export type CreateSdkClientInput = z.infer<typeof createSdkClientSchema>
export type UpdateSdkClientInput = z.infer<typeof updateSdkClientSchema>

export interface SdkClientWithApiKey extends SdkClient {
  apiKey: string
}
