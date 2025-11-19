import {z} from 'zod'

/**
 * Zod schema for CLI configuration
 */
export const CliConfigSchema = z.object({
  colorOutput: z.boolean().default(true),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

/**
 * Inferred TypeScript type for CLI configuration
 */
export type CliConfig = z.infer<typeof CliConfigSchema>
