import { describe, expect, it } from 'vitest';
import { toBookedSet } from '@/domain/availability';
import { bookingRequestSchema, createBookingFormSchema } from '@/domain/booking';

const schema = createBookingFormSchema({
  maxGuests: 4,
  today: '2026-03-01',
  windowEnd: '2026-06-01',
  booked: toBookedSet(['2026-03-12']),
});

const valid = {
  guestName: 'Ana Souza',
  email: 'ana@example.com',
  guests: 2,
  checkIn: '2026-03-10',
  checkOut: '2026-03-12',
};

function messages(input: unknown) {
  const result = schema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('booking form schema', () => {
  it('accepts a valid booking', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('requires every field', () => {
    const errors = messages({
      guestName: '',
      email: '',
      guests: Number.NaN,
      checkIn: '',
      checkOut: '',
    });
    expect(Object.keys(errors).sort()).toEqual([
      'checkIn',
      'checkOut',
      'email',
      'guestName',
      'guests',
    ]);
  });

  it('validates the email', () => {
    expect(messages({ ...valid, email: 'nope' }).email).toMatch(/valid email/i);
    expect(messages({ ...valid, email: ' ana@example.com ' })).toEqual({}); // trimmed
  });

  it('enforces the listing’s max guests', () => {
    expect(messages({ ...valid, guests: 5 }).guests).toMatch(/up to 4/);
    expect(messages({ ...valid, guests: 4 })).toEqual({});
    expect(messages({ ...valid, guests: 0 }).guests).toBeDefined();
    expect(messages({ ...valid, guests: 1.5 }).guests).toBeDefined();
  });

  it('rejects an invalid date range on check-out', () => {
    expect(messages({ ...valid, checkIn: '2026-03-10', checkOut: '2026-03-10' }).checkOut).toMatch(
      /after check-in/i,
    );
  });

  it('rejects ranges that include booked dates', () => {
    expect(messages({ ...valid, checkIn: '2026-03-11', checkOut: '2026-03-14' }).checkOut).toMatch(
      /already booked/i,
    );
  });

  it('rejects past check-in', () => {
    expect(messages({ ...valid, checkIn: '2026-02-20', checkOut: '2026-02-22' }).checkIn).toMatch(
      /past/i,
    );
  });
});

describe('bookingRequestSchema (server)', () => {
  it('requires a listing id and types the guest count as a number', () => {
    expect(bookingRequestSchema.safeParse(valid).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...valid, listingId: 'casita-001' }).success).toBe(
      true,
    );
    expect(bookingRequestSchema.safeParse({ ...valid, listingId: 'x', guests: '2' }).success).toBe(
      false,
    );
  });

  it('gives specific messages, not the generic type error, for out-of-range guests', () => {
    const result = bookingRequestSchema.safeParse({ ...valid, listingId: 'x', guests: 99 });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(/At most/);
  });
});
