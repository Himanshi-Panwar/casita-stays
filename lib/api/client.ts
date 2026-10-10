import type { z } from 'zod';
import { ApiError, type ClientErrorCode, isAbortError } from './errors';
import { errorBodySchema } from './schemas';

const KNOWN_CODES: readonly ClientErrorCode[] = [
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'BOOKING_CONFLICT',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
];

async function toApiError(response: Response): Promise<ApiError> {
  const parsed = errorBodySchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    return new ApiError(response.status, 'INTERNAL_ERROR', `Request failed (${response.status}).`);
  }
  const { code, message, details } = parsed.data.error;
  const known = KNOWN_CODES.find((c) => c === code) ?? 'INTERNAL_ERROR';
  return new ApiError(response.status, known, message, details);
}

/**
 * Typed fetch: validates the response with Zod, normalises every failure into `ApiError`,
 * and lets `AbortError` through untouched so TanStack Query can treat it as a cancellation.
 */
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error. Check your connection and try again.');
  }

  if (!response.ok) throw await toApiError(response);

  const result = schema.safeParse(await response.json().catch(() => null));
  if (!result.success) {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'The server sent an unexpected response.',
    );
  }
  return result.data;
}
