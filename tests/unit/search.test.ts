import { describe, expect, it } from 'vitest';
import {
  PAGE_SIZE,
  listingsQuerySchema,
  paginate,
  parseListingsQueryLenient,
  searchListings,
  sortListings,
  toSearchParams,
} from '@/domain/search';
import { LISTINGS } from '@/mocks/listings';
import { toSummary } from '@/lib/server/listings-service';

const summaries = LISTINGS.map(toSummary);
const base = listingsQuerySchema.parse({});

describe('mock data', () => {
  it('has 200+ deterministic listings across 5+ cities', () => {
    expect(LISTINGS.length).toBeGreaterThanOrEqual(200);
    expect(new Set(LISTINGS.map((l) => l.city)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(LISTINGS.map((l) => l.id)).size).toBe(LISTINGS.length);
  });
});

describe('listingsQuerySchema', () => {
  it('applies defaults and coerces URL strings', () => {
    expect(listingsQuerySchema.parse({ minPrice: '50', guests: '3', page: '2' })).toMatchObject({
      minPrice: 50,
      guests: 3,
      page: 2,
      sort: 'relevance',
    });
  });

  it('treats blank params as unset', () => {
    expect(listingsQuerySchema.parse({ city: '', minPrice: '', maxPrice: ' ' })).toEqual({
      sort: 'relevance',
      page: 1,
    });
  });

  it.each([
    { minPrice: 'abc' },
    { page: '0' },
    { guests: '0' },
    { sort: 'cheapest' },
    { minPrice: '200', maxPrice: '100' },
  ])('rejects %o', (input) => {
    expect(listingsQuerySchema.safeParse(input).success).toBe(false);
  });
});

describe('parseListingsQueryLenient', () => {
  it('drops only the invalid params and keeps the rest', () => {
    expect(
      parseListingsQueryLenient({ city: 'Lisbon', page: '-4', sort: 'nope', guests: '2' }),
    ).toEqual({
      city: 'Lisbon',
      guests: 2,
      sort: 'relevance',
      page: 1,
    });
  });

  it('uses the first value of repeated params', () => {
    expect(parseListingsQueryLenient({ city: ['Kyoto', 'Lisbon'] }).city).toBe('Kyoto');
  });

  it('drops an inconsistent price range instead of throwing', () => {
    const q = parseListingsQueryLenient({ minPrice: '300', maxPrice: '100' });
    expect(q.minPrice).toBeUndefined();
    expect(q.maxPrice).toBe(100);
  });
});

describe('toSearchParams', () => {
  it('omits defaults so URLs are canonical', () => {
    expect(toSearchParams(base).toString()).toBe('');
    expect(toSearchParams({ ...base, city: 'Lisbon', sort: 'price_asc', page: 3 }).toString()).toBe(
      'city=Lisbon&sort=price_asc&page=3',
    );
  });
});

describe('searchListings', () => {
  it('filters by city (case-insensitive, substring)', () => {
    const result = searchListings(summaries, { ...base, city: 'kyo' });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((l) => l.city === 'Kyoto')).toBe(true);
  });

  it('filters by inclusive price range and guest capacity', () => {
    const result = searchListings(summaries, { ...base, minPrice: 100, maxPrice: 150, guests: 4 });
    expect(
      result.items.every(
        (l) => l.pricePerNight >= 100 && l.pricePerNight <= 150 && l.maxGuests >= 4,
      ),
    ).toBe(true);
  });

  it('sorts by price and rating', () => {
    const asc = sortListings(summaries, 'price_asc').map((l) => l.pricePerNight);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const top = sortListings(summaries, 'rating_desc').map((l) => l.rating);
    expect(top).toEqual([...top].sort((a, b) => b - a));
  });

  it('sort is stable: equal prices keep their original order', () => {
    const sorted = sortListings(summaries, 'price_asc');
    for (let i = 1; i < sorted.length; i++) {
      const [a, b] = [sorted[i - 1]!, sorted[i]!];
      if (a.pricePerNight === b.pricePerNight) expect(a.id < b.id).toBe(true);
    }
  });

  it('paginates 20 per page without overlap', () => {
    const p1 = searchListings(summaries, { ...base, page: 1 });
    const p2 = searchListings(summaries, { ...base, page: 2 });
    expect(p1.items).toHaveLength(PAGE_SIZE);
    expect(p1.totalPages).toBe(Math.ceil(summaries.length / PAGE_SIZE));
    expect(new Set([...p1.items, ...p2.items].map((l) => l.id)).size).toBe(PAGE_SIZE * 2);
  });

  it('returns an empty first page when nothing matches', () => {
    const result = searchListings(summaries, { ...base, city: 'Atlantis' });
    expect(result).toMatchObject({ total: 0, totalPages: 1, page: 1, items: [] });
  });
});

describe('paginate', () => {
  it('clamps out-of-range pages and handles a partial last page', () => {
    const items = Array.from({ length: 45 }, (_, i) => i);
    expect(paginate(items, 3).items).toHaveLength(5);
    expect(paginate(items, 99).page).toBe(3);
    expect(paginate(items, 0).page).toBe(1);
  });
});
