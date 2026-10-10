import { type ListingsQuery, toSearchParams } from '@/domain/search';

/** One place for cache keys so invalidation (e.g. after a 409) can't drift from the readers. */
export const queryKeys = {
  listings: {
    search: (query: ListingsQuery) =>
      ['listings', 'search', toSearchParams(query).toString()] as const,
  },
  bookings: { all: ['bookings'] as const },
  wishlist: { all: ['wishlist'] as const },
  availability: {
    /** Prefix: invalidates every month of one listing. */
    forListing: (listingId: string) => ['availability', listingId] as const,
    month: (listingId: string, month: string) => ['availability', listingId, month] as const,
  },
};
