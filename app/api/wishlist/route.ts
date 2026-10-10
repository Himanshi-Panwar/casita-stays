import { NextResponse } from 'next/server';
import { badRequest } from '@/lib/server/errors';
import { apiRoute, NO_CACHE } from '@/lib/server/http';
import { wishlistRequestSchema, wishlistService } from '@/lib/server/wishlist-service';

export const GET = apiRoute(async () =>
  NextResponse.json({ items: wishlistService.list() }, { headers: NO_CACHE }),
);

export const POST = apiRoute(async (request) => {
  const body: unknown = await request.json().catch(() => {
    throw badRequest('Request body must be valid JSON.');
  });
  const { listingId } = wishlistRequestSchema.parse(body);
  wishlistService.add(listingId);
  return NextResponse.json({ listingId }, { status: 201, headers: NO_CACHE });
});
