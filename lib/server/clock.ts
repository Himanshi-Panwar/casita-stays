import { bookingWindowEnd as windowEnd } from '@/domain/availability';
import { todayISO } from '@/domain/dates';
import type { ISODate } from '@/domain/types';

export const today = (): ISODate => todayISO();

/** Last day a guest may check out (end of the third calendar month, exclusive night). */
export const bookingWindowEnd = (from: ISODate = today()): ISODate => windowEnd(from);
