/**
 * Options for command execution
 */
export class CommandExecutionOptionsDto {
  /**
   * Creates a new CommandExecutionOptionsDto instance
   *
   * @param cwd - Working directory for command execution
   * @param env - Custom environment variables (merged with process.env)
   * @param timeout - Maximum execution time in milliseconds
   */
  constructor(
    public readonly cwd?: string,
    public readonly env?: Record<string, string>,
    public readonly timeout?: number,
  ) {}
}
