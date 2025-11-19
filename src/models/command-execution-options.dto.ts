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
   * @param detached - Run process in detached mode (independent of parent process)
   * @param stdio - Standard I/O configuration ('pipe' for capturing, 'inherit' for interactive, 'ignore' for no output)
   */
  constructor(
    public readonly cwd?: string,
    public readonly env?: Record<string, string>,
    public readonly timeout?: number,
    public readonly detached?: boolean,
    public readonly stdio?: 'ignore' | 'inherit' | 'pipe',
  ) {}
}
