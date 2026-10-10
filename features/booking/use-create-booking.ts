import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { BookingRequest } from '@/domain/booking';
import { postBooking } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query/keys';

/**
 * Creates a booking.
 *
 * - Not retried automatically: the user decides whether to resubmit.
 * - On success: availability for the listing is invalidated (so going "back" shows fresh
 *   data) and the user is sent to the confirmation page.
 * - On 409: availability is invalidated *and awaited*, so by the time the caller's `onError`
 *   runs the calendar already reflects the dates that were just taken.
 */
export function useCreateBooking(listingId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const availabilityKey = queryKeys.availability.forListing(listingId);

  return useMutation({
    mutationFn: (request: BookingRequest) => postBooking(request),
    onSuccess: (booking) => {
      void queryClient.invalidateQueries({ queryKey: availabilityKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      router.push(`/booking/confirmation?id=${encodeURIComponent(booking.id)}`);
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.isConflict) {
        await queryClient.invalidateQueries({ queryKey: availabilityKey });
      }
    },
  });
}
