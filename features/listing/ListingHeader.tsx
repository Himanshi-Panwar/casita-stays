import BathtubOutlined from '@mui/icons-material/BathtubOutlined';
import BedOutlined from '@mui/icons-material/BedOutlined';
import PeopleOutlineOutlined from '@mui/icons-material/PeopleOutlineOutlined';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AppLink } from '@/components/AppLink';
import { RatingBadge } from '@/components/RatingBadge';
import { pluralize } from '@/lib/format';
import type { Listing } from '@/domain/types';
import { WishlistButton } from '@/features/wishlist/WishlistButton';

function Fact({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
      <span aria-hidden style={{ display: 'flex' }}>
        {icon}
      </span>
      <Typography variant="body2" component="span">
        {children}
      </Typography>
    </Stack>
  );
}

export function ListingHeader({ listing }: { listing: Listing }) {
  return (
    <header>
      <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 1.5 }}>
        <AppLink href="/" color="inherit">
          Stays
        </AppLink>
        <AppLink href={`/?city=${encodeURIComponent(listing.city)}`} color="inherit">
          {listing.city}
        </AppLink>
      </Breadcrumbs>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}
      >
        <Typography component="h1" variant="h2">
          {listing.title}
        </Typography>
        <WishlistButton listingId={listing.id} title={listing.title} variant="button" />
      </Box>
      <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', columnGap: 3, rowGap: 1 }}>
        <RatingBadge rating={listing.rating} reviewCount={listing.reviewCount} />
        <Typography variant="body2" color="text.secondary">
          {listing.city}, {listing.country}
        </Typography>
        <Fact icon={<PeopleOutlineOutlined fontSize="small" />}>
          Up to {pluralize(listing.maxGuests, 'guest')}
        </Fact>
        <Fact icon={<BedOutlined fontSize="small" />}>
          {pluralize(listing.bedrooms, 'bedroom')}
        </Fact>
        <Fact icon={<BathtubOutlined fontSize="small" />}>
          {pluralize(listing.bathrooms, 'bathroom')}
        </Fact>
      </Stack>
    </header>
  );
}
