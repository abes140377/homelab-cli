import {z} from 'zod'

export const PocketBaseConfigSchema = z.object({
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(1).optional(),
  url: z.string().url('POCKETBASE_URL must be a valid URL'),
})
