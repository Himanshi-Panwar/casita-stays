import { NextResponse } from 'next/server';
import { apiRoute, SHORT_CACHE } from '@/lib/server/http';
import { listingsService } from '@/lib/server/listings-service';

export const GET = apiRoute<{ id: string }>(async (_request, { params }) =>
  NextResponse.json(listingsService.getById(params.id), { headers: SHORT_CACHE }),
);
