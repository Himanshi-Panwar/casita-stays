import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { simulateNetwork } from './chaos';
import { AppError, type ErrorBody } from './errors';

type Handler<P> = (request: Request, context: { params: P }) => Promise<Response>;

export function errorResponse(error: unknown): NextResponse<ErrorBody> {
  if (error instanceof AppError) {
    return NextResponse.json<ErrorBody>(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json<ErrorBody>(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request is invalid.',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  console.error('[api] unhandled error', error);
  return NextResponse.json<ErrorBody>(
    { error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  );
}

/**
 * Wraps a route handler with the mock network (latency + random failure) and uniform error
 * mapping. Handlers just validate, call a service and return data.
 */
export function apiRoute<P = Record<string, never>>(handler: Handler<P>) {
  return async (request: Request, context: { params: Promise<P> }): Promise<Response> => {
    try {
      await simulateNetwork(request.signal);
      return await handler(request, { params: await context.params });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export const SHORT_CACHE = {
  'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
};
export const NO_CACHE = { 'Cache-Control': 'no-store' };
