import type {CommandExecutionOptionsDto} from '../models/command-execution-options.dto.js'
import type {CommandExecutionResultDto} from '../models/command-execution-result.dto.js'

/**
 * Formatting utilities for command execution output
 *
 * Provides consistent, standardized formatting for:
 * - Execution start messages
 * - Execution completion messages
 * - Execution error messages
 */

const SEPARATOR = '─'.repeat(60)
const ERROR_SEPARATOR = '✗'.repeat(60)

/**
 * Format the start of command execution
 *
 * @param command - The command being executed
 * @param args - Arguments passed to the command
 * @param options - Execution options (cwd, env, timeout)
 * @returns Formatted string for output
 *
 * @example
 * ```typescript
 * const output = formatExecutionStart('git', ['status'], { cwd: '/path/to/repo' });
 * console.log(output);
 * // Output:
 * // ────────────────────────────────────────────────────────────
 * // Executing: git status
 * // Working Directory: /path/to/repo
 * // ────────────────────────────────────────────────────────────
 * ```
 */
export function formatExecutionStart(
  command: string,
  args: string[],
  options?: CommandExecutionOptionsDto,
): string {
  const lines: string[] = [SEPARATOR]

  // Command line
  const commandLine = args.length > 0 ? `${command} ${args.join(' ')}` : command
  lines.push(`Executing: ${commandLine}`)

  // Working directory
  if (options?.cwd) {
    lines.push(`Working Directory: ${options.cwd}`)
  }

  // Environment variables
  if (options?.env && Object.keys(options.env).length > 0) {
    lines.push('Environment Variables:')
    for (const [key, value] of Object.entries(options.env)) {
      lines.push(`  ${key}=${value}`)
    }
  }

  // Timeout
  if (options?.timeout) {
    lines.push(`Timeout: ${options.timeout}ms`)
  }

  lines.push(SEPARATOR)

  return lines.join('\n')
}

/**
 * Format the completion of command execution
 *
 * @param result - The execution result
 * @returns Formatted string for output
 *
 * @example
 * ```typescript
 * const result = new CommandExecutionResultDto('git', ['status'], 0, '...', '', 1234);
 * const output = formatExecutionComplete(result);
 * console.log(output);
 * // Output:
 * // ────────────────────────────────────────────────────────────
 * // Completed: git status
 * // Exit Code: 0
 * // Execution Time: 1234ms (1.23s)
 * // ────────────────────────────────────────────────────────────
 * ```
 */
export function formatExecutionComplete(
  result: CommandExecutionResultDto,
): string {
  const lines: string[] = [SEPARATOR]

  // Command line
  const commandLine =
    result.args.length > 0 ?
      `${result.command} ${result.args.join(' ')}`
    : result.command
  lines.push(`Completed: ${commandLine}`, `Exit Code: ${result.exitCode}`)

  // Execution time
  const timeInSeconds = (result.executionTimeMs / 1000).toFixed(2)
  lines.push(`Execution Time: ${result.executionTimeMs}ms (${timeInSeconds}s)`)

  // Output summary
  const stdoutLines = result.stdout.trim().split('\n').length
  const stderrLines = result.stderr.trim().split('\n').length

  if (result.stdout.trim()) {
    lines.push(`Output Lines: ${stdoutLines}`)
  }

  if (result.stderr.trim()) {
    lines.push(`Error Lines: ${stderrLines}`)
  }

  lines.push(SEPARATOR)

  return lines.join('\n')
}

/**
 * Format an execution error
 *
 * @param command - The command that failed
 * @param args - Arguments passed to the command
 * @param error - The error that occurred
 * @param exitCode - Optional exit code
 * @param stderr - Optional stderr output
 * @returns Formatted string for output
 *
 * @example
 * ```typescript
 * const output = formatExecutionError(
 *   'git',
 *   ['status'],
 *   new Error('Command failed'),
 *   1,
 *   'fatal: not a git repository'
 * );
 * console.log(output);
 * // Output:
 * // ✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗
 * // Failed: git status
 * // Error: Command failed
 * // Exit Code: 1
 * // Error Output:
 * // fatal: not a git repository
 * // ✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗
 * ```
 */
export function formatExecutionError(
  command: string,
  args: string[],
  error: Error,
  exitCode?: number,
  stderr?: string,
): string {
  const lines: string[] = [ERROR_SEPARATOR]

  // Command line
  const commandLine = args.length > 0 ? `${command} ${args.join(' ')}` : command
  lines.push(`Failed: ${commandLine}`, `Error: ${error.message}`)

  // Exit code
  if (exitCode !== undefined) {
    lines.push(`Exit Code: ${exitCode}`)
  }

  // Stderr output
  if (stderr && stderr.trim()) {
    lines.push('Error Output:', stderr.trim())
  }

  lines.push(ERROR_SEPARATOR)

  return lines.join('\n')
}
