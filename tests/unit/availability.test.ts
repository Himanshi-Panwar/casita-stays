import { describe, expect, it } from 'vitest';
import {
  BOOKING_WINDOW_MONTHS,
  bookingWindowEnd,
  canCheckIn,
  canCheckOut,
  findConflicts,
  maxCheckOut,
  rangeCrossesBookedDate,
  toBookedSet,
  type SelectionContext,
} from '@/domain/availability';

// Someone is staying the nights of Mar 12 and Mar 13 (checks out Mar 14).
const booked = toBookedSet(['2026-03-12', '2026-03-13']);
const ctx: SelectionContext = { today: '2026-03-01', windowEnd: '2026-06-01', booked };

describe('findConflicts / rangeCrossesBookedDate', () => {
  it('returns the booked nights inside the stay', () => {
    expect(findConflicts('2026-03-10', '2026-03-15', booked)).toEqual(['2026-03-12', '2026-03-13']);
    expect(rangeCrossesBookedDate('2026-03-10', '2026-03-15', booked)).toBe(true);
  });

  it('allows leaving on the morning the next guest arrives (check-out on a booked date)', () => {
    expect(findConflicts('2026-03-10', '2026-03-12', booked)).toEqual([]);
  });

  it('allows arriving on the day the previous guest leaves (check-in on their check-out day)', () => {
    expect(findConflicts('2026-03-14', '2026-03-16', booked)).toEqual([]);
  });

  it('detects a stay fully inside a booked block', () => {
    expect(rangeCrossesBookedDate('2026-03-12', '2026-03-13', booked)).toBe(true);
  });

  it('detects conflicts across a month boundary', () => {
    const b = toBookedSet(['2026-04-01']);
    expect(rangeCrossesBookedDate('2026-03-30', '2026-04-02', b)).toBe(true);
    expect(rangeCrossesBookedDate('2026-03-30', '2026-04-01', b)).toBe(false);
  });

  it('is conflict-free with no bookings or an empty stay', () => {
    expect(findConflicts('2026-03-10', '2026-03-20', toBookedSet([]))).toEqual([]);
    expect(findConflicts('2026-03-12', '2026-03-12', booked)).toEqual([]);
  });
});

describe('maxCheckOut', () => {
  it('stops at the first booked night after check-in', () => {
    expect(maxCheckOut('2026-03-10', booked, '2026-06-01')).toBe('2026-03-12');
  });

  it('is capped at the window limit when nothing is booked ahead', () => {
    expect(maxCheckOut('2026-03-14', booked, '2026-06-01')).toBe('2026-06-01');
  });
});

describe('canCheckIn', () => {
  it('rejects past, booked and out-of-window dates', () => {
    expect(canCheckIn('2026-02-28', ctx)).toBe(false);
    expect(canCheckIn('2026-03-12', ctx)).toBe(false);
    expect(canCheckIn('2026-06-01', ctx)).toBe(false);
  });

  it('accepts today and free future dates, including the booking’s check-out day', () => {
    expect(canCheckIn('2026-03-01', ctx)).toBe(true);
    expect(canCheckIn('2026-03-14', ctx)).toBe(true);
  });
});

describe('canCheckOut', () => {
  it('cannot cross a booked night', () => {
    expect(canCheckOut('2026-03-10', '2026-03-12', ctx)).toBe(true);
    expect(canCheckOut('2026-03-10', '2026-03-13', ctx)).toBe(false);
    expect(canCheckOut('2026-03-10', '2026-03-20', ctx)).toBe(false);
  });

  it('must be after check-in', () => {
    expect(canCheckOut('2026-03-10', '2026-03-10', ctx)).toBe(false);
    expect(canCheckOut('2026-03-10', '2026-03-09', ctx)).toBe(false);
  });

  it('may use the day after the last bookable night as check-out', () => {
    expect(canCheckOut('2026-05-30', '2026-06-01', ctx)).toBe(true);
    expect(canCheckOut('2026-05-30', '2026-06-02', ctx)).toBe(false);
  });
});

describe('bookingWindowEnd', () => {
  it('covers the current month plus the next two', () => {
    expect(BOOKING_WINDOW_MONTHS).toBe(3);
    expect(bookingWindowEnd('2026-03-15')).toBe('2026-06-01');
  });

  it('rolls over the year and leap-year February', () => {
    expect(bookingWindowEnd('2026-11-30')).toBe('2027-02-01');
    expect(bookingWindowEnd('2023-12-01')).toBe('2024-03-01');
  });
});
