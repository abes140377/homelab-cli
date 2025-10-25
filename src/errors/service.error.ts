import {BaseError} from './base.error.js';

/**
 * Error class for service layer errors.
 * Used for business logic errors, validation failures, etc.
 */
export class ServiceError extends BaseError {}
