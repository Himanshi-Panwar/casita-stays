import { type ListingsQuery, toSearchParams } from '@/domain/search';

/** Canonical URL for a search; defaults are omitted. */
export function searchHref(query: Partial<ListingsQuery>): string {
  const qs = toSearchParams(query).toString();
  return qs ? `/?${qs}` : '/';
}
