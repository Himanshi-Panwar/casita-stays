import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ListingsQuery } from '@/domain/search';
import type { ListingSummary, Paginated } from '@/domain/types';
import { fetchListings } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';

export interface ServerSeed {
  query: ListingsQuery;
  data: Paginated<ListingSummary>;
}

/**
 * Search results for the URL's query.
 *
 * - The key is derived from the *normalised* query, so equivalent URLs share a cache entry.
 * - TanStack passes an `AbortSignal` that fires when the key changes or the component unmounts,
 *   so a slow response for an old query can never overwrite a newer one (no race).
 * - `keepPreviousData` keeps the old page on screen while the next one loads.
 * - The server-rendered page is used as `initialData` only for the query it was rendered for.
 */
export function useListingsQuery(query: ListingsQuery, seed: ServerSeed) {
  const key = queryKeys.listings.search(query);
  const seedKey = queryKeys.listings.search(seed.query);
  const isSeeded = key.join('|') === seedKey.join('|');

  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetchListings(query, signal),
    placeholderData: keepPreviousData,
    ...(isSeeded ? { initialData: seed.data } : {}),
  });
}
