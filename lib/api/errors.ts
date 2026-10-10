export type ClientErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'BOOKING_CONFLICT'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE';

/** A failed API call. `status` is 0 for network failures. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ClientErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isConflict() {
    return this.status === 409;
  }

  /** 5xx and network errors may succeed on retry; 4xx will not. */
  get isRetryable() {
    return this.status === 0 || this.status >= 500;
  }
}

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';
