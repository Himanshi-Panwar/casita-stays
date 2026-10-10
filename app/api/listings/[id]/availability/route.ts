import { NextResponse } from 'next/server';
import { apiRoute, NO_CACHE } from '@/lib/server/http';
import { listingsService } from '@/lib/server/listings-service';

export const GET = apiRoute<{ id: string }>(async (request, { params }) => {
  const month = new URL(request.url).searchParams.get('month') ?? '';
  // Availability changes whenever someone books, so it is never cached by HTTP caches.
  return NextResponse.json(listingsService.getAvailability(params.id, month), {
    headers: NO_CACHE,
  });
});
