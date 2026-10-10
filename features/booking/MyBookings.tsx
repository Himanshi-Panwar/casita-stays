'use client';

import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import WifiOffOutlined from '@mui/icons-material/WifiOffOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { StateMessage } from '@/components/StateMessage';
import type { Booking } from '@/domain/types';
import { fetchBookings } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/errors';
import { formatDate, formatMoney, pluralize } from '@/lib/format';
import { queryKeys } from '@/lib/query/keys';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography component="dt" variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 600 }}>
        {children}
      </Typography>
    </Box>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Card component="article" sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
      <Box
        sx={{
          position: 'relative',
          flex: { sm: '0 0 240px' },
          aspectRatio: { xs: '16 / 9', sm: 'auto' },
          minHeight: { sm: 190 },
        }}
      >
        <Image
          src={booking.listingImage}
          alt={`Photo of ${booking.listingTitle}`}
          fill
          sizes="(min-width: 600px) 240px, 100vw"
          style={{ objectFit: 'cover' }}
        />
      </Box>
      <Box sx={{ p: 2.5, flex: 1, display: 'grid', gap: 2, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              {booking.listingCity}
            </Typography>
            <Typography component="h2" variant="h5">
              {booking.listingTitle}
            </Typography>
          </Box>
          <Chip
            label={booking.status === 'confirmed' ? 'Confirmed' : booking.status}
            color="success"
            size="small"
            variant="outlined"
          />
        </Box>
        <Box
          component="dl"
          sx={{
            m: 0,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, auto)' },
            justifyContent: 'start',
            columnGap: { md: 4 },
          }}
        >
          <Fact label="Check-in">{formatDate(booking.checkIn)}</Fact>
          <Fact label="Check-out">{formatDate(booking.checkOut)}</Fact>
          <Fact label="Guests">{pluralize(booking.guests, 'guest')}</Fact>
          <Fact label="Total">{formatMoney(booking.price.total)}</Fact>
          <Fact label="Booking ID">
            <span style={{ fontFamily: 'ui-monospace, monospace' }}>{booking.id}</span>
          </Fact>
        </Box>
        <Box>
          <Button href={`/listings/${booking.listingId}`} variant="outlined">
            View Listing
          </Button>
        </Box>
      </Box>
    </Card>
  );
}

export function MyBookings() {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: queryKeys.bookings.all,
    queryFn: ({ signal }) => fetchBookings(signal),
  });

  if (isPending) {
    return (
      <Box aria-busy="true" aria-label="Loading bookings" sx={{ display: 'grid', gap: 3 }}>
        {[0, 1].map((i) => (
          <Skeleton key={i} variant="rounded" height={200} />
        ))}
      </Box>
    );
  }

  if (error || !data) {
    return (
      <StateMessage
        role="alert"
        icon={<WifiOffOutlined />}
        title="We couldn’t load your bookings"
        description={error instanceof ApiError ? error.message : 'Please try again.'}
        actionLabel="Try again"
        onAction={() => void refetch()}
      />
    );
  }

  if (data.items.length === 0) {
    return (
      <StateMessage
        icon={<EventBusyOutlined />}
        title="No bookings yet"
        description="When you book a stay, it will show up here."
        actionLabel="Find a stay"
        actionHref="/"
      />
    );
  }

  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 3 }}>
      {data.items.map((booking) => (
        <li key={booking.id}>
          <BookingCard booking={booking} />
        </li>
      ))}
    </Box>
  );
}
