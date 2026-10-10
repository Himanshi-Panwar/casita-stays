// Survives dev hot-reloads and is shared by all route handlers; single demo user, so one set.
const globalForWishlist = globalThis as typeof globalThis & { __casitaWishlist?: Set<string> };
const saved: Set<string> = (globalForWishlist.__casitaWishlist ??= new Set());

export const wishlistRepository = {
  /** Listing ids, most recently saved first. */
  list: (): string[] => [...saved].reverse(),
  add: (listingId: string): void => void saved.add(listingId),
  remove: (listingId: string): void => void saved.delete(listingId),
  /** Test helper. */
  reset: (): void => saved.clear(),
};
