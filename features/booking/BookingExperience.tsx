'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { type ReactNode, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { BOOKING_WINDOW_MONTHS, bookingWindowEnd } from '@/domain/availability';
import { type BookingFormValues, createBookingFormSchema } from '@/domain/booking';
import { isValidISODate, monthsFrom, nightsBetween } from '@/domain/dates';
import { calculatePriceBreakdown } from '@/domain/pricing';
import { selectDate } from '@/domain/selection';
import type { ISODate, Listing } from '@/domain/types';
import { ApiError } from '@/lib/api/errors';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { BookingForm, type FormNotice } from './BookingForm';
import { useAvailability } from './use-availability';
import { useCreateBooking } from './use-create-booking';

interface BookingExperienceProps {
  listing: Pick<Listing, 'id' | 'title' | 'pricePerNight' | 'maxGuests'>;
  /** Server-computed "today" so server and client render the same calendar (no hydration drift). */
  today: ISODate;
  /** Server-rendered listing content (description, amenities, host). */
  children: ReactNode;
}

const CONFLICT_MESSAGE =
  'Sorry — those dates were just booked by someone else. We’ve refreshed the calendar; please pick new dates.';

export function BookingExperience({ listing, today, children }: BookingExperienceProps) {
  const months = useMemo(() => monthsFrom(today, BOOKING_WINDOW_MONTHS), [today]);
  const windowEnd = useMemo(() => bookingWindowEnd(today), [today]);
  const availability = useAvailability(listing.id, months);
  const [notice, setNotice] = useState<FormNotice | null>(null);

  // Rules depend on live availability, so the schema is rebuilt when bookings change.
  const schema = useMemo(
    () =>
      createBookingFormSchema({
        maxGuests: listing.maxGuests,
        today,
        windowEnd,
        booked: availability.booked,
      }),
    [listing.maxGuests, today, windowEnd, availability.booked],
  );

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { guestName: '', email: '', guests: 1, checkIn: '', checkOut: '' },
  });
  const { setValue, setError, getValues, formState } = form;

  const [checkIn = '', checkOut = ''] = useWatch({
    control: form.control,
    name: ['checkIn', 'checkOut'],
  });
  const nights =
    isValidISODate(checkIn) && isValidISODate(checkOut) ? nightsBetween(checkIn, checkOut) : 0;
  const price = nights > 0 ? calculatePriceBreakdown(nights, listing.pricePerNight) : null;

  const booking = useCreateBooking(listing.id);

  const setDates = (next: { checkIn: ISODate | ''; checkOut: ISODate | '' }) => {
    const options = { shouldDirty: true, shouldValidate: formState.isSubmitted };
    setValue('checkIn', next.checkIn, options);
    setValue('checkOut', next.checkOut, options);
  };

  const onSelectDate = (date: ISODate) => {
    setNotice(null);
    const current = {
      checkIn: getValues('checkIn') as ISODate | '',
      checkOut: getValues('checkOut') as ISODate | '',
    };
    setDates(selectDate(current, date, { today, windowEnd, booked: availability.booked }));
  };

  const onSubmit = form.handleSubmit((values) => {
    setNotice(null);
    booking.mutate(
      { listingId: listing.id, ...values },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.isConflict) {
            // Availability has already been refetched (see useCreateBooking). Clear the stale
            // dates, explain, and move focus to the calendar so keyboard users can re-pick.
            setDates({ checkIn: '', checkOut: '' });
            setNotice({ kind: 'conflict', message: CONFLICT_MESSAGE });
            document.getElementById('availability-heading')?.focus();
            return;
          }
          if (error instanceof ApiError && error.status === 400 && Array.isArray(error.details)) {
            for (const issue of error.details as { path?: string; message?: string }[]) {
              const field = issue.path as keyof BookingFormValues | undefined;
              if (field && field in values) setError(field, { message: issue.message });
            }
            setNotice({
              kind: 'error',
              message: 'Please fix the highlighted fields and try again.',
            });
            return;
          }
          setNotice({
            kind: 'error',
            message:
              error instanceof ApiError && error.isRetryable
                ? 'We couldn’t complete your booking — this was a temporary problem on our side. You haven’t been charged. Please try again.'
                : error.message,
          });
        },
      },
    );
  });

  return (
    <Box
      sx={{
        mt: { xs: 4, md: 6 },
        display: 'grid',
        gap: { xs: 4, md: 7 },
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 380px' },
        alignItems: 'start',
      }}
    >
      <Box sx={{ display: 'grid', gap: 5, minWidth: 0 }}>
        {children}
        <section aria-labelledby="availability-heading">
          <Typography
            id="availability-heading"
            tabIndex={-1}
            component="h2"
            variant="h3"
            sx={{ mb: 2, outline: 'none' }}
          >
            Availability
          </Typography>
          <AvailabilityCalendar
            months={months}
            today={today}
            windowEnd={windowEnd}
            booked={availability.booked}
            status={availability.status}
            selection={{ checkIn: checkIn as ISODate | '', checkOut: checkOut as ISODate | '' }}
            onSelect={onSelectDate}
            onRetry={() => void availability.retryFailed()}
          />
        </section>
      </Box>

      <Card
        id="booking"
        component="aside"
        aria-label="Booking"
        sx={{
          p: { xs: 2.5, md: 3 },
          position: { md: 'sticky' },
          top: { md: 24 },
          boxShadow: '0 16px 40px rgba(28,38,34,.10)',
        }}
      >
        <BookingForm
          form={form}
          maxGuests={listing.maxGuests}
          pricePerNight={listing.pricePerNight}
          today={today}
          windowEnd={windowEnd}
          price={price}
          isPending={booking.isPending || booking.isSuccess}
          notice={notice}
          onSubmit={onSubmit}
        />
      </Card>
    </Box>
  );
}
