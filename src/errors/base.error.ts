/**
 * Base error class for all custom errors in the application.
 * Extends the native Error class with additional context.
 */
export class BaseError extends Error {
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializes the error for structured logging.
   */
  toJSON(): Record<string, unknown> {
    return {
      context: this.context,
      message: this.message,
      name: this.name,
      stack: this.stack,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
