import {BaseError} from './base.error.js';

/**
 * Error class for repository layer errors.
 * Used for data access failures, database errors, API errors, etc.
 */
export class RepositoryError extends BaseError {}
