import {z} from 'zod'

/**
 * Zod schema for command execution result
 */
export const CommandExecutionResultSchema = z.object({
  /**
   * Arguments passed to the command
   */
  args: z.array(z.string()),

  /**
   * Command that was executed
   */
  command: z.string(),

  /**
   * Execution time in milliseconds
   */
  executionTimeMs: z.number().nonnegative(),

  /**
   * Exit code from the command
   */
  exitCode: z.number(),

  /**
   * Standard error from the command
   */
  stderr: z.string(),

  /**
   * Standard output from the command
   */
  stdout: z.string(),
})

export type CommandExecutionResultType = z.infer<
  typeof CommandExecutionResultSchema
>
