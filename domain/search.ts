import { z } from 'zod';
import type { ListingSummary, Paginated, SortOption } from './types';

export const PAGE_SIZE = 20;
export const SORT_OPTIONS = ['relevance', 'price_asc', 'price_desc', 'rating_desc'] as const;
export const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Recommended',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  rating_desc: 'Top rated',
};
export const MAX_GUESTS_FILTER = 16;

//Handle Empty value
// Convert empty values into undefined.
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(blankToUndefined, z.coerce.number().pipe(schema).optional());

const QUERY_KEYS = ['city', 'minPrice', 'maxPrice', 'guests', 'sort', 'page'] as const;

export const listingsQuerySchema = z
  .object({
    city: z.preprocess(blankToUndefined, z.string().trim().max(60).optional()),
    minPrice: optionalNumber(z.number().min(0).max(100_000)),
    maxPrice: optionalNumber(z.number().min(0).max(100_000)),
    guests: optionalNumber(z.number().int().min(1).max(MAX_GUESTS_FILTER)),
    sort: z.preprocess(blankToUndefined, z.enum(SORT_OPTIONS).default('relevance')),
    page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(10_000).default(1)),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    path: ['minPrice'],
    message: 'minPrice must be less than or equal to maxPrice',
  });

export type ListingsQuery = z.output<typeof listingsQuerySchema>;
export type RawQuery = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Ignore invalid URL parameters and use default values instead.
export function parseListingsQueryLenient(raw: RawQuery): ListingsQuery {
  const input: Record<string, string | undefined> = {};
  for (const key of QUERY_KEYS) input[key] = first(raw[key]);

  for (let attempt = 0; attempt <= QUERY_KEYS.length; attempt++) {
    const result = listingsQuerySchema.safeParse(input);
    if (result.success) return result.data;
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') delete input[key];
    }
  }
  return listingsQuerySchema.parse({});
}

export const DEFAULT_QUERY: ListingsQuery = { sort: 'relevance', page: 1 };

// Convert the search filters into URL parameters.
export function toSearchParams(query: Partial<ListingsQuery>): URLSearchParams {
  const params = new URLSearchParams();
  if (query.city?.trim()) params.set('city', query.city.trim());
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  if (query.guests !== undefined) params.set('guests', String(query.guests));
  if (query.sort && query.sort !== 'relevance') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  return params;
}

type Searchable = Pick<ListingSummary, 'city' | 'pricePerNight' | 'rating' | 'maxGuests'>;

export function filterListings<T extends Searchable>(
  items: readonly T[],
  query: ListingsQuery,
): T[] {
  const city = query.city?.toLocaleLowerCase();
  return items.filter(
    (item) =>
      (!city || item.city.toLocaleLowerCase().includes(city)) &&
      (query.minPrice === undefined || item.pricePerNight >= query.minPrice) &&
      (query.maxPrice === undefined || item.pricePerNight <= query.maxPrice) &&
      (query.guests === undefined || item.maxGuests >= query.guests),
  );
}

// Keep the original order when listings have the same sort value.
export function sortListings<T extends Searchable>(items: readonly T[], sort: SortOption): T[] {
  const compare: Record<SortOption, (a: T, b: T) => number> = {
    relevance: () => 0,
    price_asc: (a, b) => a.pricePerNight - b.pricePerNight,
    price_desc: (a, b) => b.pricePerNight - a.pricePerNight,
    rating_desc: (a, b) => b.rating - a.rating,
  };
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => compare[sort](a.item, b.item) || a.index - b.index)
    .map((entry) => entry.item);
}

export function paginate<T>(items: readonly T[], page: number, pageSize = PAGE_SIZE): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

export function searchListings<T extends Searchable>(
  items: readonly T[],
  query: ListingsQuery,
): Paginated<T> {
  return paginate(sortListings(filterListings(items, query), query.sort), query.page);
}
