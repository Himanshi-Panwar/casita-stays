'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { FormEventHandler } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import type { BookingFormValues } from '@/domain/booking';
import type { ISODate, PriceBreakdown as Breakdown } from '@/domain/types';
import { formatMoney, formatMoneyWhole } from '@/lib/format';

export type FormNotice = { kind: 'conflict' | 'error'; message: string };

interface BookingFormProps {
  form: UseFormReturn<BookingFormValues>;
  maxGuests: number;
  pricePerNight: number;
  today: ISODate;
  windowEnd: ISODate;
  price: Breakdown | null;
  isPending: boolean;
  notice: FormNotice | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

/** Bridges RHF's `register` (which hands out a plain `ref`) to MUI's `inputRef`. */
function bind(
  form: UseFormReturn<BookingFormValues>,
  name: keyof BookingFormValues,
  valueAsNumber = false,
) {
  const { ref, ...rest } = form.register(name, { valueAsNumber });
  return { ...rest, inputRef: ref };
}

export function BookingForm({
  form,
  maxGuests,
  pricePerNight,
  today,
  windowEnd,
  price,
  isPending,
  notice,
  onSubmit,
}: BookingFormProps) {
  const { errors } = form.formState;

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      noValidate
      aria-label="Book this stay"
      sx={{ display: 'grid', gap: 2.25 }}
    >
      <Typography component="p">
        <Typography component="span" variant="h4">
          {formatMoneyWhole(pricePerNight)}
        </Typography>{' '}
        <Typography component="span" color="text.secondary">
          / night
        </Typography>
      </Typography>

      {notice ? (
        <Alert severity={notice.kind === 'conflict' ? 'warning' : 'error'} role="alert">
          {notice.message}
        </Alert>
      ) : null}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
        <TextField
          id="checkIn"
          label="Check-in"
          type="date"
          {...bind(form, 'checkIn')}
          error={Boolean(errors.checkIn)}
          helperText={errors.checkIn?.message}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { min: today, max: windowEnd },
          }}
        />
        <TextField
          id="checkOut"
          label="Check-out"
          type="date"
          {...bind(form, 'checkOut')}
          error={Boolean(errors.checkOut)}
          helperText={errors.checkOut?.message}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { min: today, max: windowEnd },
          }}
        />
      </Box>

      <TextField
        id="guests"
        select
        label="Guests"
        {...bind(form, 'guests', true)}
        defaultValue={form.getValues('guests')}
        error={Boolean(errors.guests)}
        helperText={errors.guests?.message}
        slotProps={{ select: { native: true } }}
      >
        {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? 'guest' : 'guests'}
          </option>
        ))}
      </TextField>

      <TextField
        id="guestName"
        label="Full name"
        autoComplete="name"
        {...bind(form, 'guestName')}
        error={Boolean(errors.guestName)}
        helperText={errors.guestName?.message}
      />
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        {...bind(form, 'email')}
        error={Boolean(errors.email)}
        helperText={errors.email?.message ?? 'We’ll send your confirmation here.'}
      />

      {price ? (
        <Box sx={{ pt: 0.5 }} aria-live="polite">
          <PriceBreakdown price={price} />
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          Select your dates to see the full price.
        </Typography>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isPending}
        aria-busy={isPending}
        startIcon={isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
      >
        {isPending ? 'Reserving…' : price ? `Reserve · ${formatMoney(price.total)}` : 'Reserve'}
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: -1 }}>
        You won’t be charged yet.
      </Typography>
    </Box>
  );
}
