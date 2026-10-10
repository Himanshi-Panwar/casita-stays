import { z } from 'zod';
import type { ListingSummary } from '@/domain/types';
import { wishlistRepository } from '@/mocks/wishlist';
import { listingsService, toSummary } from './listings-service';

export const wishlistRequestSchema = z.object({ listingId: z.string().min(1) });

/** Add/remove are idempotent, so retrying a failed request is always safe. */
export const wishlistService = {
  list(): ListingSummary[] {
    return wishlistRepository.list().map((id) => toSummary(listingsService.getById(id)));
  },

  add(listingId: string): void {
    listingsService.getById(listingId); // 404 for unknown listings
    wishlistRepository.add(listingId);
  },

  remove(listingId: string): void {
    wishlistRepository.remove(listingId);
  },
};
