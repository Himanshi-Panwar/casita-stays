export type ErrorCode =
  'VALIDATION_ERROR' | 'NOT_FOUND' | 'BOOKING_CONFLICT' | 'INTERNAL_ERROR' | 'SERVICE_UNAVAILABLE';

export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

/** Domain/service errors carry the HTTP status they map to, so route handlers stay thin. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (message: string) => new AppError(404, 'NOT_FOUND', message);
export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, 'VALIDATION_ERROR', message, details);
export const conflict = (message: string, details?: unknown) =>
  new AppError(409, 'BOOKING_CONFLICT', message, details);
