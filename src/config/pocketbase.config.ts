import {z} from 'zod'

import {PocketBaseConfigSchema} from './schemas/pocketbase-config.schema.js'

export type PocketBaseConfig = z.infer<typeof PocketBaseConfigSchema>

export function loadPocketBaseConfig(): PocketBaseConfig {
  const url = process.env.POCKETBASE_URL
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD

  if (!url) {
    throw new Error(
      'POCKETBASE_URL environment variable is required. Please set it to your PocketBase instance URL (e.g., http://127.0.0.1:8090)',
    )
  }

  // Build config object conditionally to exclude undefined values
  const configData: Record<string, string> = {url}
  if (adminEmail !== undefined) configData.adminEmail = adminEmail
  if (adminPassword !== undefined) configData.adminPassword = adminPassword

  const result = PocketBaseConfigSchema.safeParse(configData)

  if (!result.success) {
    const errors = result.error.issues.map((issue) => issue.message).join(', ')
    throw new Error(`Invalid PocketBase configuration: ${errors}`)
  }

  return result.data
}
