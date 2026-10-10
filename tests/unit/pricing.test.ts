import { describe, expect, it } from 'vitest';
import {
  CLEANING_FEE,
  calculateCleaningFee,
  calculatePriceBreakdown,
  calculateServiceFee,
  calculateSubtotal,
  priceForStay,
  roundMoney,
} from '@/domain/pricing';

describe('pricing', () => {
  it('subtotal = nights × price per night', () => {
    expect(calculateSubtotal(3, 100)).toBe(300);
    expect(calculateSubtotal(1, 129.99)).toBe(129.99);
  });

  it('cleaning fee is a flat $40 once per stay', () => {
    expect(CLEANING_FEE).toBe(40);
    expect(calculateCleaningFee(1)).toBe(40);
    expect(calculateCleaningFee(14)).toBe(40);
    expect(calculateCleaningFee(0)).toBe(0);
  });

  it('service fee is 10% of the nightly subtotal', () => {
    expect(calculateServiceFee(300)).toBe(30);
    expect(calculateServiceFee(0)).toBe(0);
  });

  it('total = subtotal + cleaning + service', () => {
    expect(calculatePriceBreakdown(3, 100)).toEqual({
      nights: 3,
      pricePerNight: 100,
      subtotal: 300,
      cleaningFee: 40,
      serviceFee: 30,
      total: 370,
    });
  });

  it('rounds to cents without float drift', () => {
    // 3 × 129.99 = 389.97; 10% = 38.997 → 39.00; total 468.97
    const price = calculatePriceBreakdown(3, 129.99);
    expect(price.subtotal).toBe(389.97);
    expect(price.serviceFee).toBe(39);
    expect(price.total).toBe(468.97);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('charges nothing for zero or negative nights (no stray cleaning fee)', () => {
    expect(calculatePriceBreakdown(0, 100).total).toBe(0);
    expect(calculatePriceBreakdown(-2, 100).total).toBe(0);
  });

  it('floors fractional nights defensively', () => {
    expect(calculatePriceBreakdown(2.9, 100).nights).toBe(2);
  });

  it('priceForStay derives nights from dates, across month boundaries', () => {
    const price = priceForStay('2026-01-30', '2026-02-02', 200);
    expect(price.nights).toBe(3);
    expect(price.total).toBe(600 + 40 + 60);
  });

  it('priceForStay is zero for an inverted range', () => {
    expect(priceForStay('2026-03-10', '2026-03-05', 200).total).toBe(0);
  });
});
