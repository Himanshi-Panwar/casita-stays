import type { BookingRequest } from '@/domain/booking';
import { type ListingsQuery, toSearchParams } from '@/domain/search';
import { apiFetch } from './client';
import {
  availabilitySchema,
  bookingSchema,
  bookingsListSchema,
  paginatedListingsSchema,
  wishlistItemSchema,
  wishlistSchema,
} from './schemas';

export const fetchListings = (query: Partial<ListingsQuery>, signal?: AbortSignal) => {
  const qs = toSearchParams(query).toString();
  return apiFetch(`/api/listings${qs ? `?${qs}` : ''}`, paginatedListingsSchema, { signal });
};

export const fetchAvailability = (listingId: string, month: string, signal?: AbortSignal) =>
  apiFetch(
    `/api/listings/${encodeURIComponent(listingId)}/availability?month=${month}`,
    availabilitySchema,
    { signal },
  );

export const postBooking = (request: BookingRequest) =>
  apiFetch('/api/bookings', bookingSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

export const fetchBookings = (signal?: AbortSignal) =>
  apiFetch('/api/bookings', bookingsListSchema, { signal });

export const fetchWishlist = (signal?: AbortSignal) =>
  apiFetch('/api/wishlist', wishlistSchema, { signal });

export const addToWishlist = (listingId: string) =>
  apiFetch('/api/wishlist', wishlistItemSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId }),
  });

export const removeFromWishlist = (listingId: string) =>
  apiFetch(`/api/wishlist/${encodeURIComponent(listingId)}`, wishlistItemSchema, {
    method: 'DELETE',
  });
