import { describe, expect, it } from 'vitest';
import { toBookedSet, type SelectionContext } from '@/domain/availability';
import { EMPTY_SELECTION, isDateSelectable, selectDate } from '@/domain/selection';

const ctx: SelectionContext = {
  today: '2026-03-01',
  windowEnd: '2026-06-01',
  booked: toBookedSet(['2026-03-12', '2026-03-13']),
};

describe('selectDate (two-click range picking)', () => {
  it('first click sets check-in', () => {
    expect(selectDate(EMPTY_SELECTION, '2026-03-10', ctx)).toEqual({
      checkIn: '2026-03-10',
      checkOut: '',
    });
  });

  it('second click sets check-out', () => {
    expect(selectDate({ checkIn: '2026-03-10', checkOut: '' }, '2026-03-12', ctx)).toEqual({
      checkIn: '2026-03-10',
      checkOut: '2026-03-12',
    });
  });

  it('refuses a check-out that would cross a booked night', () => {
    const open = { checkIn: '2026-03-10', checkOut: '' } as const;
    expect(selectDate(open, '2026-03-15', ctx)).toEqual(open);
  });

  it('clicking an earlier date while a check-in is pending restarts from that date', () => {
    expect(selectDate({ checkIn: '2026-03-10', checkOut: '' }, '2026-03-05', ctx)).toEqual({
      checkIn: '2026-03-05',
      checkOut: '',
    });
  });

  it('clicking the same date again keeps the pending check-in', () => {
    const open = { checkIn: '2026-03-10', checkOut: '' } as const;
    expect(selectDate(open, '2026-03-10', ctx)).toEqual(open);
  });

  it('after a complete range, the next click starts a new one', () => {
    expect(
      selectDate({ checkIn: '2026-03-10', checkOut: '2026-03-12' }, '2026-03-20', ctx),
    ).toEqual({
      checkIn: '2026-03-20',
      checkOut: '',
    });
  });

  it('ignores booked, past and out-of-window dates', () => {
    expect(selectDate(EMPTY_SELECTION, '2026-03-12', ctx)).toEqual(EMPTY_SELECTION);
    expect(selectDate(EMPTY_SELECTION, '2026-02-20', ctx)).toEqual(EMPTY_SELECTION);
    expect(selectDate(EMPTY_SELECTION, '2026-06-01', ctx)).toEqual(EMPTY_SELECTION);
  });
});

describe('isDateSelectable', () => {
  it('with no selection, only free future nights are selectable', () => {
    expect(isDateSelectable(EMPTY_SELECTION, '2026-03-10', ctx)).toBe(true);
    expect(isDateSelectable(EMPTY_SELECTION, '2026-03-12', ctx)).toBe(false);
  });

  it('with a pending check-in, dates beyond the next booking are disabled but the first booked date stays selectable as check-out', () => {
    const open = { checkIn: '2026-03-10', checkOut: '' } as const;
    expect(isDateSelectable(open, '2026-03-11', ctx)).toBe(true);
    expect(isDateSelectable(open, '2026-03-12', ctx)).toBe(true);
    expect(isDateSelectable(open, '2026-03-13', ctx)).toBe(false);
    expect(isDateSelectable(open, '2026-03-20', ctx)).toBe(false);
  });
});
