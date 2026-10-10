import { addDays, eachNight } from '@/domain/dates';
import type { Booking, ISODate } from '@/domain/types';
import { createRng, hashString } from './random';

export interface BookedRange {
  checkIn: ISODate;
  checkOut: ISODate;
}

/** How far ahead pre-existing reservations are generated. */
const SEED_HORIZON_DAYS = 110;

/**
 * Deterministic "pre-existing reservations" for a listing, anchored on `today` so the calendar
 * always has realistic booked blocks in the visible window.
 */
export function seededRanges(listingId: string, today: ISODate): BookedRange[] {
  const rng = createRng(hashString(`${listingId}:${today}`));
  const ranges: BookedRange[] = [];
  let cursor = addDays(today, rng.int(0, 12));
  const horizon = addDays(today, SEED_HORIZON_DAYS);

  while (cursor < horizon) {
    const checkIn = addDays(cursor, rng.int(0, 12));
    const checkOut = addDays(checkIn, rng.int(2, 7));
    ranges.push({ checkIn, checkOut });
    cursor = checkOut;
  }
  return ranges;
}

interface Store {
  bookings: Map<string, Booking>;
  /** Reservations created through the API, per listing. */
  userRanges: Map<string, BookedRange[]>;
  seedCache: Map<string, BookedRange[]>;
}

// Survive Next.js dev hot-reloads and be shared by every route handler in the process.
const globalForStore = globalThis as typeof globalThis & { __casitaStore?: Store };
const store: Store = (globalForStore.__casitaStore ??= {
  bookings: new Map(),
  userRanges: new Map(),
  seedCache: new Map(),
});

function rangesFor(listingId: string, today: ISODate): BookedRange[] {
  const key = `${listingId}:${today}`;
  let seeded = store.seedCache.get(key);
  if (!seeded) {
    seeded = seededRanges(listingId, today);
    store.seedCache.set(key, seeded);
  }
  return [...seeded, ...(store.userRanges.get(listingId) ?? [])];
}

/**
 * The store outlives dev hot-reloads, so it can hold records written before a field existed.
 * Default missing fields on read so one old record can't break the whole list.
 */
const withStatus = (booking: Booking): Booking => ({
  ...booking,
  status: booking.status ?? 'confirmed',
});

export const bookingsRepository = {
  /** Every booked night for a listing. */
  getBookedNights(listingId: string, today: ISODate): Set<ISODate> {
    const nights = new Set<ISODate>();
    for (const range of rangesFor(listingId, today)) {
      for (const night of eachNight(range.checkIn, range.checkOut)) nights.add(night);
    }
    return nights;
  },

  list(): Booking[] {
    return [...store.bookings.values()]
      .map(withStatus)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  findById(id: string): Booking | undefined {
    const booking = store.bookings.get(id);
    return booking && withStatus(booking);
  },

  /** Synchronous on purpose: check-then-insert must not yield to another request. */
  insert(booking: Booking): void {
    store.bookings.set(booking.id, booking);
    const ranges = store.userRanges.get(booking.listingId) ?? [];
    ranges.push({ checkIn: booking.checkIn, checkOut: booking.checkOut });
    store.userRanges.set(booking.listingId, ranges);
  },

  /** Test helper. */
  reset(): void {
    store.bookings.clear();
    store.userRanges.clear();
    store.seedCache.clear();
  },
};
