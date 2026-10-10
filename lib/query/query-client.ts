import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/errors';

const MAX_RETRIES = 2;

/** Retry transient failures (network, 5xx) only. 4xx will fail identically every time. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  return !(error instanceof ApiError) || error.isRetryable;
}

/** Exponential backoff with jitter: ~1s, ~2s, capped at 8s. */
export const retryDelay = (attempt: number): number =>
  Math.min(1000 * 2 ** attempt, 8000) * (0.75 + Math.random() * 0.5);

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        retryDelay,
        refetchOnWindowFocus: false,
      },
      // Mutations (bookings) are not auto-retried: the user decides whether to resubmit.
      mutations: { retry: false },
    },
  });
}
