import { describe, expect, it } from 'vitest';
import { toBookedSet } from '@/domain/availability';
import { validateStay } from '@/domain/stay';

const rules = {
  today: '2026-03-01',
  windowEnd: '2026-06-01',
  booked: toBookedSet(['2026-03-12', '2026-03-13']),
};

describe('validateStay', () => {
  it('accepts a valid stay and reports the nights', () => {
    expect(validateStay({ checkIn: '2026-03-02', checkOut: '2026-03-05' }, rules)).toEqual({
      ok: true,
      nights: 3,
    });
  });

  it('requires both dates', () => {
    expect(validateStay({ checkIn: '', checkOut: '2026-03-05' }, rules)).toMatchObject({
      code: 'CHECK_IN_REQUIRED',
    });
    expect(validateStay({ checkIn: '2026-03-02', checkOut: '' }, rules)).toMatchObject({
      code: 'CHECK_OUT_REQUIRED',
    });
  });

  it('rejects malformed and impossible dates', () => {
    expect(validateStay({ checkIn: '2026-02-30', checkOut: '2026-03-05' }, rules)).toMatchObject({
      code: 'INVALID_DATE',
    });
    expect(validateStay({ checkIn: 'soon', checkOut: '2026-03-05' }, rules)).toMatchObject({
      code: 'INVALID_DATE',
    });
  });

  it('rejects check-in in the past but allows today', () => {
    expect(validateStay({ checkIn: '2026-02-28', checkOut: '2026-03-03' }, rules)).toMatchObject({
      code: 'CHECK_IN_IN_PAST',
    });
    expect(validateStay({ checkIn: '2026-03-01', checkOut: '2026-03-03' }, rules).ok).toBe(true);
  });

  it('requires check-out after check-in (no same-day stays)', () => {
    expect(validateStay({ checkIn: '2026-03-05', checkOut: '2026-03-05' }, rules)).toMatchObject({
      code: 'CHECK_OUT_NOT_AFTER_CHECK_IN',
    });
    expect(validateStay({ checkIn: '2026-03-05', checkOut: '2026-03-04' }, rules)).toMatchObject({
      code: 'CHECK_OUT_NOT_AFTER_CHECK_IN',
    });
  });

  it('enforces the 3-month booking window (inclusive of the closing check-out day)', () => {
    expect(validateStay({ checkIn: '2026-05-30', checkOut: '2026-06-01' }, rules).ok).toBe(true);
    expect(validateStay({ checkIn: '2026-05-30', checkOut: '2026-06-02' }, rules)).toMatchObject({
      code: 'OUTSIDE_BOOKING_WINDOW',
    });
  });

  it('reports the conflicting nights when a booked date lies inside the range', () => {
    expect(validateStay({ checkIn: '2026-03-10', checkOut: '2026-03-15' }, rules)).toEqual({
      ok: false,
      code: 'DATES_UNAVAILABLE',
      conflicts: ['2026-03-12', '2026-03-13'],
    });
  });

  it('lets the stay end exactly where a booking begins', () => {
    expect(validateStay({ checkIn: '2026-03-10', checkOut: '2026-03-12' }, rules).ok).toBe(true);
  });

  it('skips the rules whose inputs are omitted', () => {
    expect(
      validateStay({ checkIn: '2026-03-10', checkOut: '2026-03-15' }, { today: '2026-03-01' }).ok,
    ).toBe(true);
  });
});
