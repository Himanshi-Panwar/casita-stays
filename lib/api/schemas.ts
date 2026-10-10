import { z } from 'zod';
import type { Availability, Booking, ListingSummary, Paginated } from '@/domain/types';

/** Runtime validation of API responses: the network boundary is the one place types can lie. */
const listingSummary: z.ZodType<ListingSummary> = z.object({
  id: z.string(),
  title: z.string(),
  city: z.string(),
  country: z.string(),
  pricePerNight: z.number(),
  rating: z.number(),
  reviewCount: z.number(),
  maxGuests: z.number(),
  coverImage: z.string(),
});

export const paginatedListingsSchema: z.ZodType<Paginated<ListingSummary>> = z.object({
  items: z.array(listingSummary),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const availabilitySchema: z.ZodType<Availability> = z.object({
  listingId: z.string(),
  month: z.string(),
  bookedDates: z.array(z.string()),
});

export const bookingSchema: z.ZodType<Booking> = z.object({
  id: z.string(),
  listingId: z.string(),
  listingTitle: z.string(),
  listingCity: z.string(),
  listingImage: z.string(),
  guestName: z.string(),
  email: z.string(),
  guests: z.number(),
  checkIn: z.string(),
  checkOut: z.string(),
  price: z.object({
    nights: z.number(),
    pricePerNight: z.number(),
    subtotal: z.number(),
    cleaningFee: z.number(),
    serviceFee: z.number(),
    total: z.number(),
  }),
  status: z.literal('confirmed'),
  createdAt: z.string(),
});

export const bookingsListSchema = z.object({ items: z.array(bookingSchema) });

export const wishlistSchema = z.object({ items: z.array(listingSummary) });

export const wishlistItemSchema = z.object({ listingId: z.string() });

export const errorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
