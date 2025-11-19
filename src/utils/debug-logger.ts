import {getCliConfig} from '../config/cli.config.js'

/**
 * Logs detailed error information when debug log level is active.
 * Checks CLI configuration for log level to conditionally output debug information.
 *
 * @param message - Descriptive message about where/why the error occurred
 * @param error - The error object (Error instance or unknown value)
 * @param context - Additional context for debugging (excludes sensitive data)
 *
 * @example
 * ```typescript
 * try {
 *   await apiCall()
 * } catch (error) {
 *   logDebugError('API call failed', error, {
 *     endpoint: '/api/resource',
 *     method: 'GET',
 *     // Exclude: apiKey, token, password
 *   })
 *   return failure(new RepositoryError('API call failed'))
 * }
 * ```
 */
export function logDebugError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  // Check log level from CLI config (supports HOMELAB_LOG_LEVEL env override)
  const logLevel = getLogLevel()

  if (logLevel !== 'debug' && logLevel !== 'trace') {
    return // Skip debug output at higher log levels
  }

  // Output debug information to stderr
  console.error(`\n[DEBUG] ${message}`)

  if (error instanceof Error) {
    console.error('Error:', error.message)
    if (error.stack) {
      console.error('Stack:', error.stack)
    }

    if ('cause' in error && error.cause) {
      console.error('Cause:', error.cause)
    }
  } else {
    console.error('Error:', error)
  }

  if (context && Object.keys(context).length > 0) {
    console.error('Context:', JSON.stringify(context, null, 2))
  }

  console.error('') // Empty line for readability
}

/**
 * Gets the current log level from CLI config.
 * Supports environment variable override via HOMELAB_LOG_LEVEL.
 *
 * @returns Current log level ('debug' | 'trace' | 'info' | 'warn' | 'error')
 */
function getLogLevel(): string {
  try {
    return getCliConfig().get('logLevel')
  } catch {
    // If config is not accessible, default to 'info'
    return 'info'
  }
}
