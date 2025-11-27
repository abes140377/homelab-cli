import {z} from 'zod'

/**
 * Zod schema for Proxmox configuration.
 * Nested within the main CLI config.
 */
export const ProxmoxConfigSchema = z.object({
  host: z.string().min(1, 'PROXMOX_HOST must not be empty').optional(),
  port: z
    .number()
    .int()
    .positive('PROXMOX_PORT must be a positive integer')
    .default(8006),
  realm: z.string().min(1, 'PROXMOX_REALM must not be empty').optional(),
  rejectUnauthorized: z.boolean().default(true),
  tokenKey: z.string().min(1, 'PROXMOX_TOKEN_KEY must not be empty').optional(),
  tokenSecret: z
    .string()
    .min(1, 'PROXMOX_TOKEN_SECRET must not be empty')
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      'PROXMOX_TOKEN_SECRET must be a valid UUID format',
    )
    .optional(),
  user: z.string().min(1, 'PROXMOX_USER must not be empty').optional(),
})

/**
 * Zod schema for CLI configuration
 */
export const CliConfigSchema = z.object({
  colorOutput: z.boolean().default(true),
  logLevel: z.enum(['debug', 'trace', 'info', 'warn', 'error']).default('info'),
  projectsDir: z.string().min(1, 'PROJECTS_DIR must not be empty').default('~/projects/'),
  proxmox: ProxmoxConfigSchema.default({port: 8006, rejectUnauthorized: true}),
})

/**
 * Inferred TypeScript type for Proxmox configuration
 */
export type ProxmoxConfig = z.infer<typeof ProxmoxConfigSchema>

/**
 * Required Proxmox configuration type (all fields required)
 * Used when interacting with Proxmox API
 */
export type RequiredProxmoxConfig = Required<ProxmoxConfig>

/**
 * Inferred TypeScript type for CLI configuration
 */
export type CliConfig = z.infer<typeof CliConfigSchema>
