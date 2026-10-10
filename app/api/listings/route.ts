import { NextResponse } from 'next/server';
import { listingsQuerySchema } from '@/domain/search';
import { apiRoute, SHORT_CACHE } from '@/lib/server/http';
import { listingsService } from '@/lib/server/listings-service';

export const GET = apiRoute(async (request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = listingsQuerySchema.parse(params);
  return NextResponse.json(listingsService.search(query), { headers: SHORT_CACHE });
});
