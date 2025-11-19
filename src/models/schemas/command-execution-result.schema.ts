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
   * Null when stdio is 'inherit' or 'ignore'
   */
  stderr: z.string().nullable(),

  /**
   * Standard output from the command
   * Null when stdio is 'inherit' or 'ignore'
   */
  stdout: z.string().nullable(),
})

export type CommandExecutionResultType = z.infer<
  typeof CommandExecutionResultSchema
>
