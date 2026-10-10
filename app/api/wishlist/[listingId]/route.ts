import { NextResponse } from 'next/server';
import { apiRoute, NO_CACHE } from '@/lib/server/http';
import { wishlistService } from '@/lib/server/wishlist-service';

export const DELETE = apiRoute<{ listingId: string }>(async (_request, { params }) => {
  wishlistService.remove(params.listingId);
  return NextResponse.json({ listingId: params.listingId }, { headers: NO_CACHE });
});
