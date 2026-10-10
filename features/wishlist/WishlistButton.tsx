'use client';

import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import { useWishlist, useWishlistToggle } from './use-wishlist';

interface WishlistButtonProps {
  listingId: string;
  title: string;
  /** `icon` floats on cards; `button` is the labelled version for the details page. */
  variant?: 'icon' | 'button';
}

export function WishlistButton({ listingId, title, variant = 'icon' }: WishlistButtonProps) {
  const { data } = useWishlist();
  const toggle = useWishlistToggle(listingId);
  const savedOnServer = data?.items.some((item) => item.id === listingId) ?? false;
  // While a request is in flight, show the state the user asked for.
  const saved = toggle.isPending ? toggle.variables : savedOnServer;
  const Icon = saved ? Favorite : FavoriteBorder;

  return (
    <>
      {variant === 'icon' ? (
        <IconButton
          onClick={() => toggle.mutate(!saved)}
          aria-pressed={saved}
          aria-label={`Save ${title} to wishlist`}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2, // above the card's stretched link
            bgcolor: 'rgba(255,255,255,.92)',
            color: saved ? 'secondary.main' : 'text.primary',
            '&:hover': { bgcolor: '#fff' },
          }}
        >
          <Icon />
        </IconButton>
      ) : (
        <Button
          variant="outlined"
          onClick={() => toggle.mutate(!saved)}
          aria-pressed={saved}
          aria-label={`Save ${title} to wishlist`}
          startIcon={<Icon color={saved ? 'secondary' : 'inherit'} />}
        >
          {saved ? 'Saved' : 'Save'}
        </Button>
      )}
      <Snackbar
        open={toggle.isError}
        autoHideDuration={5000}
        onClose={() => toggle.reset()}
        message="Couldn’t update your wishlist. Please try again."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
