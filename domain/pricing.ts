import { nightsBetween } from './dates';
import type { ISODate, PriceBreakdown } from './types';

export const CLEANING_FEE = 40;
export const SERVICE_FEE_RATE = 0.1;

// Round the amount to two decimal places.
export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateSubtotal = (nights: number, pricePerNight: number): number =>
  roundMoney(nights * pricePerNight);

export const calculateCleaningFee = (nights: number): number => (nights > 0 ? CLEANING_FEE : 0);

// Calculate the 10% service fee on the nightly subtotal.
export const calculateServiceFee = (subtotal: number): number =>
  roundMoney(subtotal * SERVICE_FEE_RATE);

export function calculatePriceBreakdown(nights: number, pricePerNight: number): PriceBreakdown {
  const safeNights = Math.max(0, Math.floor(nights));
  const subtotal = calculateSubtotal(safeNights, pricePerNight);
  const cleaningFee = calculateCleaningFee(safeNights);
  const serviceFee = calculateServiceFee(subtotal);
  return {
    nights: safeNights,
    pricePerNight,
    subtotal,
    cleaningFee,
    serviceFee,
    total: roundMoney(subtotal + cleaningFee + serviceFee),
  };
}

export const priceForStay = (
  checkIn: ISODate,
  checkOut: ISODate,
  pricePerNight: number,
): PriceBreakdown => calculatePriceBreakdown(nightsBetween(checkIn, checkOut), pricePerNight);
