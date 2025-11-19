import {z} from 'zod'

/**
 * Zod schema for command execution options
 */
export const CommandExecutionOptionsSchema = z.object({
  /**
   * Working directory for command execution
   */
  cwd: z.string().optional(),

  /**
   * Custom environment variables (merged with process.env)
   */
  env: z.record(z.string(), z.string()).optional(),

  /**
   * Maximum execution time in milliseconds
   */
  timeout: z.number().positive().optional(),
})

export type CommandExecutionOptionsType = z.infer<
  typeof CommandExecutionOptionsSchema
>
