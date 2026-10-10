import type { ISODate, MonthKey } from './types';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_KEY = /^(\d{4})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

// Check the date format and make sure it is a valid calendar date
export function isValidISODate(value: string): value is ISODate {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function isValidMonthKey(value: string): value is MonthKey {
  const match = MONTH_KEY.exec(value);
  if (!match) return false;
  const m = Number(match[2]);
  return m >= 1 && m <= 12;
}

export function parseISODate(value: ISODate): Date {
  if (!isValidISODate(value)) throw new RangeError(`Invalid ISO date: ${value}`);
  return new Date(`${value}T00:00:00.000Z`);
}

export function toISODate(date: Date): ISODate {
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(value: ISODate, days: number): ISODate {
  return toISODate(new Date(parseISODate(value).getTime() + days * MS_PER_DAY));
}

// Returns the number of days between two dates.
export function diffInDays(a: ISODate, b: ISODate): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / MS_PER_DAY);
}

// Returns the number of nights in the stay, or 0 if check-out is invalid.
export function nightsBetween(checkIn: ISODate, checkOut: ISODate): number {
  return Math.max(0, diffInDays(checkIn, checkOut));
}

// Returns the nights between check-in and check-out, excluding the checkout date.
export function eachNight(checkIn: ISODate, checkOut: ISODate): ISODate[] {
  const count = nightsBetween(checkIn, checkOut);
  return Array.from({ length: count }, (_, i) => addDays(checkIn, i));
}

export const monthKeyOf = (value: ISODate): MonthKey => value.slice(0, 7);

export function firstDayOfMonth(month: MonthKey): ISODate {
  if (!isValidMonthKey(month)) throw new RangeError(`Invalid month: ${month}`);
  return `${month}-01`;
}

export function lastDayOfMonth(month: MonthKey): ISODate {
  if (!isValidMonthKey(month)) throw new RangeError(`Invalid month: ${month}`);
  const [y, m] = month.split('-').map(Number) as [number, number];
  return toISODate(new Date(Date.UTC(y, m, 0)));
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}`;
}

// Returns the specified number of months starting from the month of the given date.
export function monthsFrom(from: ISODate, count: number): MonthKey[] {
  const start = monthKeyOf(from);
  return Array.from({ length: count }, (_, i) => addMonths(start, i));
}

// Returns the day of the week, starting with Monday as 0.
export function weekdayMondayFirst(value: ISODate): number {
  return (parseISODate(value).getUTCDay() + 6) % 7;
}

// Returns today's date in UTC.
export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}
