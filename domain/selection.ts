import { type SelectionContext, canCheckIn, canCheckOut, maxCheckOut } from './availability';
import type { ISODate } from './types';

export interface DateSelection {
  checkIn: ISODate | '';
  checkOut: ISODate | '';
}

export const EMPTY_SELECTION: DateSelection = { checkIn: '', checkOut: '' };

const isOpen = (s: DateSelection): s is { checkIn: ISODate; checkOut: '' } =>
  s.checkIn !== '' && s.checkOut === '';

// Handle date selection: first click sets check-in, second click sets check-out.
// Do not allow ranges that include booked nights or dates that are unavailable.
export function selectDate(
  current: DateSelection,
  date: ISODate,
  ctx: SelectionContext,
): DateSelection {
  if (isOpen(current)) {
    if (canCheckOut(current.checkIn, date, ctx))
      return { checkIn: current.checkIn, checkOut: date };
    // Earlier date than the pending check-in: treat it as a new check-in.
    if (date <= current.checkIn && canCheckIn(date, ctx)) return { checkIn: date, checkOut: '' };
    return current;
  }
  return canCheckIn(date, ctx) ? { checkIn: date, checkOut: '' } : current;
}

// Check if a date can be selected based on the current booking selection.
export function isDateSelectable(
  current: DateSelection,
  date: ISODate,
  ctx: SelectionContext,
): boolean {
  if (isOpen(current)) {
    if (date <= current.checkIn) return canCheckIn(date, ctx);
    return canCheckOut(current.checkIn, date, ctx);
  }
  return canCheckIn(date, ctx);
}

// Returns the latest available checkout date for the selected check-in.
export const lastSelectableCheckOut = (checkIn: ISODate, ctx: SelectionContext): ISODate =>
  maxCheckOut(checkIn, ctx.booked, ctx.windowEnd);
