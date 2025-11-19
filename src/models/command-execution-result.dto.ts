/**
 * Result of command execution
 */
export class CommandExecutionResultDto {
  /**
   * Creates a new CommandExecutionResultDto instance
   *
   * @param command - Command that was executed
   * @param args - Arguments passed to the command
   * @param exitCode - Exit code from the command
   * @param stdout - Standard output from the command
   * @param stderr - Standard error from the command
   * @param executionTimeMs - Execution time in milliseconds
   */
  constructor(
    public readonly command: string,
    public readonly args: string[],
    public readonly exitCode: number,
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly executionTimeMs: number,
  ) {}
}
