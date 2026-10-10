import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { MyBookings } from '@/features/booking/MyBookings';

export const metadata: Metadata = { title: 'My bookings', robots: { index: false } };

export default function BookingsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
      <Typography component="h1" variant="h2" sx={{ mb: 4 }}>
        My bookings
      </Typography>
      <MyBookings />
    </Container>
  );
}
