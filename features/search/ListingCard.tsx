import PeopleOutlineOutlined from '@mui/icons-material/PeopleOutlineOutlined';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import NextLink from 'next/link';
import { RatingBadge } from '@/components/RatingBadge';
import type { ListingSummary } from '@/domain/types';
import { formatMoneyWhole } from '@/lib/format';
import { WishlistButton } from '@/features/wishlist/WishlistButton';

export const listingGridSx = {
  display: 'grid',
  gap: { xs: 2, md: 3 },
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
  listStyle: 'none',
  m: 0,
  p: 0,
} as const;

interface ListingCardProps {
  listing: ListingSummary;
  /** Above-the-fold cards load eagerly; the rest are lazy by default. */
  priority?: boolean;
}

export function ListingCard({ listing, priority = false }: ListingCardProps) {
  return (
    <Card
      component="article"
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow .2s ease, transform .2s ease',
        '&:hover': { boxShadow: '0 12px 32px rgba(28,38,34,.12)', transform: 'translateY(-2px)' },
        '&:focus-within': { boxShadow: '0 12px 32px rgba(28,38,34,.12)' },
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '4 / 3', bgcolor: 'action.hover' }}>
        <Image
          src={listing.coverImage}
          alt={`Photo of ${listing.title}`}
          fill
          sizes="(min-width: 1200px) 380px, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw"
          style={{ objectFit: 'cover' }}
          priority={priority}
        />
        <WishlistButton listingId={listing.id} title={listing.title} />
      </Box>
      <Stack spacing={0.75} sx={{ p: 2.25, flexGrow: 1 }}>
        <Typography variant="overline" color="text.secondary">
          {listing.city}, {listing.country}
        </Typography>
        <Typography component="h3" variant="h5">
          {/* Stretched link: the whole card is one click target with a single tab stop. */}
          <Link
            component={NextLink}
            href={`/listings/${listing.id}`}
            color="inherit"
            underline="none"
            sx={{
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
              },
            }}
          >
            {listing.title}
          </Link>
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', color: 'text.secondary' }}>
          <RatingBadge rating={listing.rating} reviewCount={listing.reviewCount} />
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <PeopleOutlineOutlined aria-hidden sx={{ fontSize: 18 }} />
            <Typography variant="body2" component="span">
              Up to {listing.maxGuests}
            </Typography>
          </Stack>
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <Typography sx={{ pt: 1 }}>
          <Typography component="span" variant="h5">
            {formatMoneyWhole(listing.pricePerNight)}
          </Typography>{' '}
          <Typography component="span" variant="body2" color="text.secondary">
            / night
          </Typography>
        </Typography>
      </Stack>
    </Card>
  );
}
