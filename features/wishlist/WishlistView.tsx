'use client';

import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import WifiOffOutlined from '@mui/icons-material/WifiOffOutlined';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { StateMessage } from '@/components/StateMessage';
import { ApiError } from '@/lib/api/errors';
import { ListingCard, listingGridSx } from '@/features/search/ListingCard';
import { useWishlist } from './use-wishlist';

export function WishlistView() {
  const { data, error, isPending, refetch } = useWishlist();

  if (isPending) {
    return (
      <Box component="ul" sx={listingGridSx} aria-busy="true" aria-label="Loading wishlist">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i}>
            <Skeleton variant="rounded" sx={{ aspectRatio: '4 / 3', height: 'auto' }} />
            <Skeleton width="40%" sx={{ mt: 1.5 }} />
            <Skeleton width="80%" height={32} />
          </li>
        ))}
      </Box>
    );
  }

  if (error || !data) {
    return (
      <StateMessage
        role="alert"
        icon={<WifiOffOutlined />}
        title="We couldn’t load your wishlist"
        description={error instanceof ApiError ? error.message : 'Please try again.'}
        actionLabel="Try again"
        onAction={() => void refetch()}
      />
    );
  }

  if (data.items.length === 0) {
    return (
      <StateMessage
        icon={<FavoriteBorder />}
        title="Your wishlist is empty"
        description="Tap the heart on any stay to save it here for later."
        actionLabel="Browse stays"
        actionHref="/"
      />
    );
  }

  return (
    <Box component="ul" sx={listingGridSx}>
      {data.items.map((listing) => (
        <li key={listing.id}>
          <ListingCard listing={listing} />
        </li>
      ))}
    </Box>
  );
}
