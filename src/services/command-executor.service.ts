import {execa} from 'execa'

import type {CommandExecutionOptionsDto} from '../models/command-execution-options.dto.js'
import type {Result} from '../utils/result.js'

import {CommandExecutionResultDto} from '../models/command-execution-result.dto.js'

/**
 * Service for executing shell commands using execa
 *
 * Provides a wrapper around execa with:
 * - Result pattern for consistent error handling
 * - Event-based streaming for real-time output
 * - Configurable options (cwd, env, timeout)
 */
export class CommandExecutorService {
  /**
   * Execute a shell command with the given arguments and options
   *
   * @param command - The command to execute (e.g., 'git', 'npm', 'echo')
   * @param args - Array of arguments to pass to the command
   * @param options - Optional execution options (cwd, env, timeout)
   * @param outputCallback - Optional callback for streaming output (receives stdout/stderr chunks)
   * @returns Result containing CommandExecutionResultDto or Error
   *
   * @example
   * ```typescript
   * const service = new CommandExecutorService();
   *
   * // Simple execution
   * const result = await service.executeCommand('echo', ['Hello, World!']);
   *
   * // With working directory
   * const result = await service.executeCommand('git', ['status'], {
   *   cwd: '/path/to/repo'
   * });
   *
   * // With streaming output
   * const result = await service.executeCommand('npm', ['install'], {}, (data) => {
   *   console.log(data);
   * });
   * ```
   */
  async executeCommand(
    command: string,
    args: string[] = [],
    options?: CommandExecutionOptionsDto,
    outputCallback?: (data: string) => void,
  ): Promise<Result<CommandExecutionResultDto, Error>> {
    const startTime = Date.now()

    try {
      // Determine stdio configuration
      const stdio = options?.stdio ?? 'pipe'

      // Build execa options
      // Note: reject: false prevents throwing on non-zero exit codes,
      // but ENOENT and other spawn errors still throw
      const execaOptions = {
        all: stdio === 'pipe', // Only interleave stdout and stderr when capturing
        cwd: options?.cwd,
        detached: options?.detached ?? false,
        env: options?.env,
        reject: false, // Don't throw on non-zero exit codes
        stdio, // Use configured stdio
        timeout: options?.timeout,
      }

      // Execute command with execa
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subprocess = execa(command, args, execaOptions as any)

      // If detached, unref the subprocess to allow parent to exit independently
      if (options?.detached && subprocess) {
        subprocess.unref()
      }

      // Set up streaming for stdout if callback provided
      // Note: stdout/stderr are only available when stdio is 'pipe'
      if (outputCallback && stdio === 'pipe' && subprocess.stdout) {
        subprocess.stdout.on('data', (chunk: Buffer | string) => {
          outputCallback(typeof chunk === 'string' ? chunk : chunk.toString())
        })
      }

      // Set up streaming for stderr if callback provided
      if (outputCallback && stdio === 'pipe' && subprocess.stderr) {
        subprocess.stderr.on('data', (chunk: Buffer | string) => {
          outputCallback(typeof chunk === 'string' ? chunk : chunk.toString())
        })
      }

      // Wait for command to complete
      const result = await subprocess

      const executionTimeMs = Date.now() - startTime

      // Check for spawn/execution errors (with reject: false, these come as failed results)
      if ('failed' in result && result.failed) {
        // Command not found (ENOENT)
        if ('code' in result && result.code === 'ENOENT') {
          return {
            error: new Error(
              `Command '${command}' not found. Please ensure it is installed and in your PATH.`,
            ),
            success: false,
          }
        }

        // Working directory errors (ENOENT for cwd)
        if (
          'code' in result &&
          result.code === 'ENOENT' &&
          'message' in result &&
          typeof result.message === 'string' &&
          result.message.includes('cwd')
        ) {
          return {
            error: new Error(
              `Invalid working directory: ${options?.cwd}. Directory does not exist.`,
            ),
            success: false,
          }
        }

        // Other failures
        if ('code' in result && result.code) {
          return {
            error: new Error(
              `Command '${command}' failed: ${result.code}${('message' in result && typeof result.message === 'string') ? ` - ${result.message}` : ''}`,
            ),
            success: false,
          }
        }
      }

      // Check if command was killed (timeout or signal)
      if (result.isTerminated && result.signal) {
        return {
          error: new Error(
            `Command '${command}' was terminated by signal ${result.signal}${options?.timeout ? ` (timeout: ${options.timeout}ms)` : ''}.`,
          ),
          success: false,
        }
      }

      // Build result DTO
      // Note: stdout/stderr are null when stdio is 'inherit' or 'ignore'
      const resultDto = new CommandExecutionResultDto(
        command,
        args,
        result.exitCode ?? 0,
        stdio === 'pipe' ? (result.stdout ?? '') : null,
        stdio === 'pipe' ? (result.stderr ?? '') : null,
        executionTimeMs,
      )

      return {data: resultDto, success: true}
    } catch (error) {
      // Catch block for unexpected errors that slip through reject: false
      // Most errors will be handled in the try block above

      // Handle execa-specific errors
      if (error && typeof error === 'object' && 'code' in error) {
        const execaError = error as {
          code?: string
          command?: string
          exitCode?: number
          message?: string
          stderr?: string
          stdout?: string
        }

        // Command not found (ENOENT)
        if (execaError.code === 'ENOENT') {
          return {
            error: new Error(
              `Command '${command}' not found. Please ensure it is installed and in your PATH.`,
            ),
            success: false,
          }
        }

        // Timeout exceeded (ETIMEDOUT)
        if (execaError.code === 'ETIMEDOUT') {
          return {
            error: new Error(
              `Command '${command}' timed out after ${options?.timeout}ms.`,
            ),
            success: false,
          }
        }

        // Other execution errors with exit code
        if (execaError.exitCode !== undefined && execaError.exitCode !== 0) {
          const errorMessage = [
            `Command '${command}' failed with exit code ${execaError.exitCode}.`,
            execaError.stderr ? `\nError output: ${execaError.stderr}` : '',
          ]
            .filter(Boolean)
            .join('')

          return {
            error: new Error(errorMessage),
            success: false,
          }
        }
      }

      // Generic error fallback
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        error: new Error(`Failed to execute command '${command}': ${errorMessage}`),
        success: false,
      }
    }
  }
}
