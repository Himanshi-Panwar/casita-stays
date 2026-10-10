import { addDays, addMonths, eachNight, lastDayOfMonth, monthKeyOf } from './dates';
import type { ISODate } from './types';

// Number of months available for booking, including the current month.
export const BOOKING_WINDOW_MONTHS = 3;

// Latest allowed checkout date.
export function bookingWindowEnd(today: ISODate): ISODate {
  const lastMonth = addMonths(monthKeyOf(today), BOOKING_WINDOW_MONTHS - 1);
  return addDays(lastDayOfMonth(lastMonth), 1);
}

export type BookedSet = ReadonlySet<ISODate>;

export const toBookedSet = (dates: Iterable<ISODate>): BookedSet => new Set(dates);

// A date is booked if the night starting on that date is unavailable.
export const isNightBooked = (date: ISODate, booked: BookedSet): boolean => booked.has(date);

// Returns booked nights between check-in and check-out dates.
export function findConflicts(checkIn: ISODate, checkOut: ISODate, booked: BookedSet): ISODate[] {
  return eachNight(checkIn, checkOut).filter((night) => booked.has(night));
}

export const rangeCrossesBookedDate = (
  checkIn: ISODate,
  checkOut: ISODate,
  booked: BookedSet,
): boolean => findConflicts(checkIn, checkOut, booked).length > 0;

// Returns the latest checkout date, stopping at the first booked night or the limit.
export function maxCheckOut(checkIn: ISODate, booked: BookedSet, limit: ISODate): ISODate {
  let cursor = checkIn;
  while (cursor < limit) {
    if (booked.has(cursor)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return limit;
}

export interface SelectionContext {
  today: ISODate;
  windowEnd: ISODate;
  booked: BookedSet;
}

// Check that the date is in the future, within the booking window, and available.
export function canCheckIn(date: ISODate, { today, windowEnd, booked }: SelectionContext): boolean {
  return date >= today && date < windowEnd && !booked.has(date);
}

// Check that no booked nights fall between check-in and check-out.
export function canCheckOut(checkIn: ISODate, date: ISODate, ctx: SelectionContext): boolean {
  return date > checkIn && date <= maxCheckOut(checkIn, ctx.booked, ctx.windowEnd);
}
