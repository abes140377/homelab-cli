/**
 * Result type for explicit error handling.
 * Represents the outcome of an operation that can either succeed or fail.
 */
export type Result<T, E> =
  | { data: T; success: true; }
  | { error: E; success: false; };

/**
 * Helper function to create a successful Result.
 */
export function success<T, E>(data: T): Result<T, E> {
  return { data, success: true };
}

/**
 * Helper function to create a failed Result.
 */
export function failure<T, E>(error: E): Result<T, E> {
  return { error, success: false };
}
