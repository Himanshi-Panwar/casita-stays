import { NextResponse } from 'next/server';
import { bookingRequestSchema } from '@/domain/booking';
import { bookingsService } from '@/lib/server/bookings-service';
import { badRequest } from '@/lib/server/errors';
import { apiRoute, NO_CACHE } from '@/lib/server/http';

export const GET = apiRoute(async () =>
  NextResponse.json({ items: bookingsService.list() }, { headers: NO_CACHE }),
);

export const POST = apiRoute(async (request) => {
  const body: unknown = await request.json().catch(() => {
    throw badRequest('Request body must be valid JSON.');
  });
  const booking = bookingsService.create(bookingRequestSchema.parse(body));
  return NextResponse.json(booking, { status: 201, headers: NO_CACHE });
});
