import { type UseQueryResult, useQueries, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { type BookedSet } from '@/domain/availability';
import type { Availability, MonthKey } from '@/domain/types';
import { fetchAvailability } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';

export type MonthStatus = 'pending' | 'error' | 'success';

export interface AvailabilityState {
  booked: BookedSet;
  status: Record<MonthKey, MonthStatus>;
  isFetching: boolean;
}

/**
 * One query per month, fetched in parallel and cached independently: navigating away and
 * back reuses fresh months, and a single failing month does not blank the whole calendar.
 * Stale data stays visible if a background refetch fails.
 */
export function useAvailability(listingId: string, months: MonthKey[]) {
  const queryClient = useQueryClient();

  const combine = useCallback(
    (results: UseQueryResult<Availability>[]): AvailabilityState => {
      const booked = new Set<string>();
      const status: Record<MonthKey, MonthStatus> = {};
      results.forEach((result, index) => {
        const month = months[index];
        if (!month) return;
        status[month] = result.data ? 'success' : result.isError ? 'error' : 'pending';
        result.data?.bookedDates.forEach((date) => booked.add(date));
      });
      return { booked, status, isFetching: results.some((r) => r.isFetching) };
    },
    [months],
  );

  const state = useQueries({
    queries: months.map((month) => ({
      queryKey: queryKeys.availability.month(listingId, month),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchAvailability(listingId, month, signal),
      // Availability changes whenever anyone books, so keep it fresher than listing data.
      staleTime: 15_000,
    })),
    combine,
  });

  const retryFailed = useCallback(
    () =>
      queryClient.refetchQueries({
        queryKey: queryKeys.availability.forListing(listingId),
        predicate: (query) => query.state.status === 'error',
      }),
    [queryClient, listingId],
  );

  return { ...state, retryFailed };
}
