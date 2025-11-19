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
   * @param stdout - Standard output from the command (null when stdio is 'inherit' or 'ignore')
   * @param stderr - Standard error from the command (null when stdio is 'inherit' or 'ignore')
   * @param executionTimeMs - Execution time in milliseconds
   */
  constructor(
    public readonly command: string,
    public readonly args: string[],
    public readonly exitCode: number,
    public readonly stdout: null | string,
    public readonly stderr: null | string,
    public readonly executionTimeMs: number,
  ) {}
}
