import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import Container from '@mui/material/Container';
import type { Metadata } from 'next';
import { StateMessage } from '@/components/StateMessage';
import { ConfirmationView } from '@/features/booking/ConfirmationView';
import { AppError } from '@/lib/server/errors';
import { bookingsService } from '@/lib/server/bookings-service';
import type { Booking } from '@/domain/types';

export const metadata: Metadata = {
  title: 'Booking confirmed',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ id?: string | string[] }>;
}

function findBooking(id: string | undefined): Booking | null {
  if (!id) return null;
  try {
    return bookingsService.getById(id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) return null;
    throw error;
  }
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const booking = findBooking(Array.isArray(id) ? id[0] : id);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
      {booking ? (
        <ConfirmationView booking={booking} />
      ) : (
        <StateMessage
          icon={<ReceiptLongOutlined />}
          title="We couldn’t find that booking"
          description="The booking ID is missing or unknown. If you just booked, check your confirmation email — otherwise start a new search."
          actionLabel="Browse stays"
          actionHref="/"
          headingLevel="h1"
        />
      )}
    </Container>
  );
}
