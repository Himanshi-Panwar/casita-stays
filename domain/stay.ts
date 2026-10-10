import { type BookedSet, findConflicts } from './availability';
import { isValidISODate, nightsBetween } from './dates';
import type { ISODate } from './types';

export type StayErrorCode =
  | 'CHECK_IN_REQUIRED'
  | 'CHECK_OUT_REQUIRED'
  | 'INVALID_DATE'
  | 'CHECK_IN_IN_PAST'
  | 'CHECK_OUT_NOT_AFTER_CHECK_IN'
  | 'OUTSIDE_BOOKING_WINDOW'
  | 'DATES_UNAVAILABLE';

export interface StayInput {
  checkIn: string;
  checkOut: string;
}

export interface StayRules {
  today: ISODate;
  windowEnd?: ISODate;
  booked?: BookedSet;
}

export type StayResult =
  { ok: true; nights: number } | { ok: false; code: StayErrorCode; conflicts?: ISODate[] };

// Validate the stay and return the first error if any check fails.
export function validateStay({ checkIn, checkOut }: StayInput, rules: StayRules): StayResult {
  if (!checkIn) return { ok: false, code: 'CHECK_IN_REQUIRED' };
  if (!checkOut) return { ok: false, code: 'CHECK_OUT_REQUIRED' };
  if (!isValidISODate(checkIn) || !isValidISODate(checkOut)) {
    return { ok: false, code: 'INVALID_DATE' };
  }
  if (checkIn < rules.today) return { ok: false, code: 'CHECK_IN_IN_PAST' };
  if (checkOut <= checkIn) return { ok: false, code: 'CHECK_OUT_NOT_AFTER_CHECK_IN' };
  if (rules.windowEnd && checkOut > rules.windowEnd) {
    return { ok: false, code: 'OUTSIDE_BOOKING_WINDOW' };
  }
  if (rules.booked) {
    const conflicts = findConflicts(checkIn, checkOut, rules.booked);
    if (conflicts.length > 0) return { ok: false, code: 'DATES_UNAVAILABLE', conflicts };
  }
  return { ok: true, nights: nightsBetween(checkIn, checkOut) };
}

export const STAY_ERROR_MESSAGES: Record<StayErrorCode, string> = {
  CHECK_IN_REQUIRED: 'Choose a check-in date.',
  CHECK_OUT_REQUIRED: 'Choose a check-out date.',
  INVALID_DATE: 'Enter valid dates.',
  CHECK_IN_IN_PAST: 'Check-in cannot be in the past.',
  CHECK_OUT_NOT_AFTER_CHECK_IN: 'Check-out must be after check-in.',
  OUTSIDE_BOOKING_WINDOW: 'Dates must fall within the next 3 months.',
  DATES_UNAVAILABLE: 'Some of these nights are already booked.',
};

// Identify which date field should display the error message.
export const STAY_ERROR_FIELD: Record<StayErrorCode, 'checkIn' | 'checkOut'> = {
  CHECK_IN_REQUIRED: 'checkIn',
  CHECK_OUT_REQUIRED: 'checkOut',
  INVALID_DATE: 'checkIn',
  CHECK_IN_IN_PAST: 'checkIn',
  CHECK_OUT_NOT_AFTER_CHECK_IN: 'checkOut',
  OUTSIDE_BOOKING_WINDOW: 'checkOut',
  DATES_UNAVAILABLE: 'checkOut',
};
