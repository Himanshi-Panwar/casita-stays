import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  diffInDays,
  eachNight,
  isValidISODate,
  isValidMonthKey,
  lastDayOfMonth,
  monthsFrom,
  nightsBetween,
  weekdayMondayFirst,
} from '@/domain/dates';

describe('isValidISODate', () => {
  it.each(['2026-03-01', '2024-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(isValidISODate(value)).toBe(true);
  });

  it.each([
    ['', 'empty'],
    ['2026-3-1', 'unpadded'],
    ['2026-02-30', 'day past month end'],
    ['2025-02-29', 'non-leap Feb 29'],
    ['2026-13-01', 'month 13'],
    ['2026-00-10', 'month 0'],
    ['2026-03-01T00:00:00Z', 'timestamp'],
    ['20260301', 'no separators'],
    ['275760-09-13', 'extended year'],
  ])('rejects %s (%s)', (value) => {
    expect(isValidISODate(value)).toBe(false);
  });
});

describe('isValidMonthKey', () => {
  it('accepts real months only', () => {
    expect(isValidMonthKey('2026-01')).toBe(true);
    expect(isValidMonthKey('2026-12')).toBe(true);
    expect(isValidMonthKey('2026-13')).toBe(false);
    expect(isValidMonthKey('2026-00')).toBe(false);
    expect(isValidMonthKey('2026-1')).toBe(false);
  });
});

describe('nightsBetween', () => {
  it('counts nights, not days', () => {
    expect(nightsBetween('2026-03-10', '2026-03-11')).toBe(1);
    expect(nightsBetween('2026-03-10', '2026-03-13')).toBe(3);
  });

  it('is 0 for same-day or reversed ranges', () => {
    expect(nightsBetween('2026-03-10', '2026-03-10')).toBe(0);
    expect(nightsBetween('2026-03-10', '2026-03-05')).toBe(0);
  });

  it('crosses month and year boundaries', () => {
    expect(nightsBetween('2026-01-30', '2026-02-02')).toBe(3);
    expect(nightsBetween('2026-12-30', '2027-01-02')).toBe(3);
  });

  it('handles leap years', () => {
    expect(nightsBetween('2024-02-28', '2024-03-01')).toBe(2);
    expect(nightsBetween('2025-02-28', '2025-03-01')).toBe(1);
  });

  it('is unaffected by DST transitions (UTC calendar math)', () => {
    expect(nightsBetween('2026-03-28', '2026-03-30')).toBe(2); // EU spring-forward
    expect(nightsBetween('2026-10-24', '2026-10-26')).toBe(2); // EU fall-back
  });

  it('throws on invalid input rather than returning NaN', () => {
    expect(() => nightsBetween('nope', '2026-03-01')).toThrow(RangeError);
  });
});

describe('eachNight', () => {
  it('excludes the check-out day', () => {
    expect(eachNight('2026-03-10', '2026-03-13')).toEqual([
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
    ]);
  });

  it('is empty for zero-length stays', () => {
    expect(eachNight('2026-03-10', '2026-03-10')).toEqual([]);
  });
});

describe('month helpers', () => {
  it('lastDayOfMonth handles 28/29/30/31', () => {
    expect(lastDayOfMonth('2026-02')).toBe('2026-02-28');
    expect(lastDayOfMonth('2024-02')).toBe('2024-02-29');
    expect(lastDayOfMonth('2026-04')).toBe('2026-04-30');
    expect(lastDayOfMonth('2026-12')).toBe('2026-12-31');
  });

  it('addMonths rolls over years in both directions', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('monthsFrom returns consecutive months starting at the date’s month', () => {
    expect(monthsFrom('2026-11-20', 3)).toEqual(['2026-11', '2026-12', '2027-01']);
  });

  it('addDays/diffInDays round-trip across month ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(diffInDays('2026-01-31', addDays('2026-01-31', 45))).toBe(45);
  });

  it('weekdayMondayFirst', () => {
    expect(weekdayMondayFirst('2026-03-02')).toBe(0); // Monday
    expect(weekdayMondayFirst('2026-03-08')).toBe(6); // Sunday
  });
});
