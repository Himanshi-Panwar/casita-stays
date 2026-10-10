import { z } from 'zod';
import { firstDayOfMonth, isValidMonthKey, lastDayOfMonth } from '@/domain/dates';
import { type ListingsQuery, searchListings } from '@/domain/search';
import type { Availability, Listing, ListingSummary, Paginated } from '@/domain/types';
import { bookingsRepository } from '@/mocks/bookings';
import { listingsRepository } from '@/mocks/listings';
import { today } from './clock';
import { notFound } from './errors';

export const monthParamSchema = z
  .string()
  .refine(isValidMonthKey, { message: 'month must be formatted YYYY-MM' });

export const toSummary = (listing: Listing): ListingSummary => ({
  id: listing.id,
  title: listing.title,
  city: listing.city,
  country: listing.country,
  pricePerNight: listing.pricePerNight,
  rating: listing.rating,
  reviewCount: listing.reviewCount,
  maxGuests: listing.maxGuests,
  coverImage: listing.images[0] ?? '',
});

const summaries: readonly ListingSummary[] = listingsRepository.all().map(toSummary);

export const listingsService = {
  search(query: ListingsQuery): Paginated<ListingSummary> {
    return searchListings(summaries, query);
  },

  getById(id: string): Listing {
    const listing = listingsRepository.findById(id);
    if (!listing) throw notFound(`Listing "${id}" was not found.`);
    return listing;
  },

  getAvailability(listingId: string, month: string): Availability {
    const parsed = monthParamSchema.parse(month);
    this.getById(listingId);
    const from = firstDayOfMonth(parsed);
    const to = lastDayOfMonth(parsed);
    const bookedDates = [...bookingsRepository.getBookedNights(listingId, today())]
      .filter((night) => night >= from && night <= to)
      .sort();
    return { listingId, month: parsed, bookedDates };
  },
};
