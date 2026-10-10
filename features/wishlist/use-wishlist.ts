import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addToWishlist, fetchWishlist, removeFromWishlist } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';

/** One shared query: every heart button and the wishlist page read the same cache entry. */
export function useWishlist() {
  return useQuery({
    queryKey: queryKeys.wishlist.all,
    queryFn: ({ signal }) => fetchWishlist(signal),
  });
}

/**
 * Save/remove one listing. The mutation's `variables` drive the button while the request is in
 * flight, and the shared list is refetched afterwards (also on failure, to resync).
 */
export function useWishlistToggle(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (save: boolean) =>
      save ? addToWishlist(listingId) : removeFromWishlist(listingId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all }),
  });
}
