import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import type { Booking } from '@/domain/types';
import { formatDateLong, pluralize } from '@/lib/format';

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography component="dt" variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>
        {children}
      </Typography>
    </Box>
  );
}

/** Pure server-rendered receipt. No client JS. */
export function ConfirmationView({ booking }: { booking: Booking }) {
  const { price } = booking;
  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircleOutlined aria-hidden color="primary" sx={{ fontSize: 56 }} />
        <Typography component="h1" variant="h2" sx={{ mt: 1 }}>
          You’re booked, {booking.guestName.split(' ')[0]}!
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          A confirmation has been sent to {booking.email}.
        </Typography>
      </Box>

      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box
            sx={{
              position: 'relative',
              flex: { sm: '0 0 40%' },
              aspectRatio: { xs: '16 / 9', sm: 'auto' },
              minHeight: { sm: 220 },
            }}
          >
            <Image
              src={booking.listingImage}
              alt={`Photo of ${booking.listingTitle}`}
              fill
              sizes="(min-width: 600px) 300px, 100vw"
              style={{ objectFit: 'cover' }}
              priority
            />
          </Box>
          <Box sx={{ p: 3, flex: 1 }}>
            <Typography variant="overline" color="text.secondary">
              {booking.listingCity}
            </Typography>
            <Typography component="h2" variant="h4">
              {booking.listingTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Booking ID
            </Typography>
            <Typography
              sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: 1 }}
              data-testid="booking-id"
            >
              {booking.id}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <Box
          sx={{ p: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}
        >
          <Box component="dl" sx={{ m: 0, display: 'grid', gap: 2 }}>
            <Detail label="Check-in">{formatDateLong(booking.checkIn)}</Detail>
            <Detail label="Check-out">{formatDateLong(booking.checkOut)}</Detail>
            <Detail label="Guests">{pluralize(booking.guests, 'guest')}</Detail>
            <Detail label="Length of stay">{pluralize(price.nights, 'night')}</Detail>
          </Box>
          <Box>
            <Typography component="h2" variant="h5" sx={{ mb: 1.5 }}>
              Price details
            </Typography>
            <PriceBreakdown price={price} />
          </Box>
        </Box>
      </Card>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button href="/" variant="outlined" size="large">
          Keep exploring stays
        </Button>
      </Box>
    </Box>
  );
}
