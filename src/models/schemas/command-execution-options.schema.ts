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
   * Run process in detached mode (independent of parent process)
   */
  detached: z.boolean().optional(),

  /**
   * Custom environment variables (merged with process.env)
   */
  env: z.record(z.string(), z.string()).optional(),

  /**
   * Standard I/O configuration
   * - 'pipe': Capture output (default)
   * - 'inherit': Pass through to parent for interactive sessions
   * - 'ignore': Discard output
   */
  stdio: z.enum(['pipe', 'inherit', 'ignore']).optional(),

  /**
   * Maximum execution time in milliseconds
   */
  timeout: z.number().positive().optional(),
})

export type CommandExecutionOptionsType = z.infer<
  typeof CommandExecutionOptionsSchema
>
