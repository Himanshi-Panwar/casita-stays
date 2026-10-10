import { findConflicts } from '@/domain/availability';
import type { BookingRequest } from '@/domain/booking';
import { priceForStay } from '@/domain/pricing';
import { STAY_ERROR_MESSAGES, validateStay } from '@/domain/stay';
import type { Booking } from '@/domain/types';
import { bookingsRepository } from '@/mocks/bookings';
import { bookingWindowEnd, today } from './clock';
import { badRequest, conflict, notFound } from './errors';
import { listingsService } from './listings-service';

export const bookingsService = {
  /**
   * Creates a booking. The availability check and the insert run synchronously with no `await`
   * in between, so two concurrent requests for the same dates cannot both succeed.
   */
  create(request: BookingRequest): Booking {
    const listing = listingsService.getById(request.listingId);

    if (request.guests > listing.maxGuests) {
      throw badRequest(`This listing sleeps up to ${listing.maxGuests} guests.`, [
        { path: 'guests', message: `Maximum ${listing.maxGuests} guests` },
      ]);
    }

    const now = today();
    const stay = validateStay(request, { today: now, windowEnd: bookingWindowEnd(now) });
    if (!stay.ok) {
      throw badRequest(STAY_ERROR_MESSAGES[stay.code], [
        { path: 'checkIn', message: STAY_ERROR_MESSAGES[stay.code] },
      ]);
    }

    const booked = bookingsRepository.getBookedNights(listing.id, now);
    const conflicts = findConflicts(request.checkIn, request.checkOut, booked);
    if (conflicts.length > 0) {
      throw conflict('Those dates are no longer available.', { conflictingDates: conflicts });
    }

    const booking: Booking = {
      id: `CSA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      listingCity: listing.city,
      listingImage: listing.images[0] ?? '',
      guestName: request.guestName,
      email: request.email,
      guests: request.guests,
      checkIn: request.checkIn,
      checkOut: request.checkOut,
      price: priceForStay(request.checkIn, request.checkOut, listing.pricePerNight),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    bookingsRepository.insert(booking);
    return booking;
  },

  /** All bookings for the demo user (there is no auth), newest first. */
  list(): Booking[] {
    return bookingsRepository.list();
  },

  getById(id: string): Booking {
    const booking = bookingsRepository.findById(id);
    if (!booking) throw notFound(`Booking "${id}" was not found.`);
    return booking;
  },
};
