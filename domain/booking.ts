import { z } from 'zod';
import { STAY_ERROR_FIELD, STAY_ERROR_MESSAGES, validateStay, type StayRules } from './stay';

export const MAX_GUESTS_PER_BOOKING = 20;

const guestName = z.string().trim().min(2, 'Enter your full name').max(80, 'Name is too long');
const email = z
  .string()
  .trim()
  .min(1, 'Enter your email')
  .max(120)
  .pipe(z.email('Enter a valid email address'));
const guests = z
  .number({
    error: (issue) => (issue.code === 'invalid_type' ? 'Choose the number of guests' : undefined),
  })
  .int('Guests must be a whole number')
  .min(1, 'At least 1 guest')
  .max(MAX_GUESTS_PER_BOOKING, `At most ${MAX_GUESTS_PER_BOOKING} guests`);

// Guest details used by both the booking form and API.
export const bookingFieldsSchema = z.object({
  guestName,
  email,
  guests,
  // Check required fields before running the custom validation.
  checkIn: z.string().min(1, STAY_ERROR_MESSAGES.CHECK_IN_REQUIRED),
  checkOut: z.string().min(1, STAY_ERROR_MESSAGES.CHECK_OUT_REQUIRED),
});
export type BookingFormValues = z.infer<typeof bookingFieldsSchema>;

// Request body for creating a booking. Date and availability checks are handled by the service.
export const bookingRequestSchema = bookingFieldsSchema.extend({
  listingId: z.string().min(1),
});
export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export interface BookingRules extends StayRules {
  maxGuests: number;
}

// Create a form schema using the listing's capacity, booked dates, and booking window.
export function createBookingFormSchema(rules: BookingRules) {
  return bookingFieldsSchema.superRefine((values, ctx) => {
    if (values.guests > rules.maxGuests) {
      ctx.addIssue({
        code: 'custom',
        path: ['guests'],
        message: `This place sleeps up to ${rules.maxGuests} guest${rules.maxGuests === 1 ? '' : 's'}`,
      });
    }
    const stay = validateStay(values, rules);
    if (!stay.ok) {
      ctx.addIssue({
        code: 'custom',
        path: [STAY_ERROR_FIELD[stay.code]],
        message: STAY_ERROR_MESSAGES[stay.code],
      });
    }
  });
}
