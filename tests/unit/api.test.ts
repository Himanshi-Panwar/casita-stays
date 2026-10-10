// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as createBooking } from '@/app/api/bookings/route';
import { GET as getAvailability } from '@/app/api/listings/[id]/availability/route';
import { GET as getListing } from '@/app/api/listings/[id]/route';
import { GET as getListings } from '@/app/api/listings/route';
import { findConflicts } from '@/domain/availability';
import { addDays } from '@/domain/dates';
import { simulateNetwork } from '@/lib/server/chaos';
import { AppError } from '@/lib/server/errors';
import { bookingsRepository } from '@/mocks/bookings';

const TODAY = '2026-03-10';
const noParams = { params: Promise.resolve({}) };
const idParams = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (path: string) => new Request(`http://test${path}`);
const post = (body: unknown) =>
  new Request('http://test/api/bookings', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

beforeAll(() => {
  vi.stubEnv('MOCK_FAILURE_RATE', '0');
  vi.stubEnv('MOCK_LATENCY_MIN', '0');
  vi.stubEnv('MOCK_LATENCY_MAX', '0');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
});
afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
beforeEach(() => bookingsRepository.reset());

/** First free [checkIn, checkOut) of `nights` nights for the listing, found from live availability. */
function findFreeStay(listingId: string, nights: number) {
  const booked = bookingsRepository.getBookedNights(listingId, TODAY);
  for (let offset = 1; offset < 80; offset++) {
    const checkIn = addDays(TODAY, offset);
    const checkOut = addDays(checkIn, nights);
    if (findConflicts(checkIn, checkOut, booked).length === 0) return { checkIn, checkOut };
  }
  throw new Error('no free stay found');
}

const guest = { guestName: 'Ana Souza', email: 'ana@example.com', guests: 2 };

describe('GET /api/listings', () => {
  it('returns a page of 20 with pagination metadata', async () => {
    const response = await getListings(get('/api/listings'), noParams);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(20);
    expect(body.total).toBeGreaterThanOrEqual(200);
    expect(body.page).toBe(1);
  });

  it('applies filters, sort and page from the query string', async () => {
    const response = await getListings(
      get('/api/listings?city=Lisbon&sort=price_desc&page=2'),
      noParams,
    );
    const body = await response.json();
    expect(body.page).toBe(2);
    expect(body.items.every((l: { city: string }) => l.city === 'Lisbon')).toBe(true);
    const prices = body.items.map((l: { pricePerNight: number }) => l.pricePerNight);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it('400s on an invalid query', async () => {
    const response = await getListings(get('/api/listings?minPrice=abc'), noParams);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/listings/:id', () => {
  it('returns full details', async () => {
    const response = await getListing(get('/api/listings/casita-001'), idParams('casita-001'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ id: 'casita-001' });
    expect(body.images.length).toBeGreaterThan(0);
    expect(body.host.name).toBeTruthy();
  });

  it('404s for an unknown listing', async () => {
    const response = await getListing(get('/api/listings/nope'), idParams('nope'));
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/listings/:id/availability', () => {
  it('returns booked nights for the requested month only', async () => {
    const response = await getAvailability(
      get('/api/listings/casita-001/availability?month=2026-03'),
      idParams('casita-001'),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.month).toBe('2026-03');
    expect(body.bookedDates.length).toBeGreaterThan(0);
    expect(body.bookedDates.every((d: string) => d.startsWith('2026-03-'))).toBe(true);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it.each(['', '2026-3', '2026-13', 'March'])('400s on month=%j', async (month) => {
    const response = await getAvailability(
      get(`/api/listings/casita-001/availability?month=${month}`),
      idParams('casita-001'),
    );
    expect(response.status).toBe(400);
  });

  it('404s for an unknown listing', async () => {
    const response = await getAvailability(
      get('/api/listings/x/availability?month=2026-03'),
      idParams('x'),
    );
    expect(response.status).toBe(404);
  });
});

describe('POST /api/bookings', () => {
  it('creates a booking with server-side pricing', async () => {
    const stay = findFreeStay('casita-001', 3);
    const response = await createBooking(
      post({ listingId: 'casita-001', ...guest, ...stay }),
      noParams,
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.id).toMatch(/^CSA-/);
    expect(body.price).toMatchObject({ nights: 3, cleaningFee: 40 });
    expect(body.price.total).toBeCloseTo(body.price.subtotal * 1.1 + 40, 2);
  });

  it('409s when the same dates are booked twice, and then reports them as unavailable', async () => {
    const stay = findFreeStay('casita-001', 2);
    const payload = { listingId: 'casita-001', ...guest, ...stay };
    expect((await createBooking(post(payload), noParams)).status).toBe(201);

    const conflict = await createBooking(post(payload), noParams);
    const body = await conflict.json();
    expect(conflict.status).toBe(409);
    expect(body.error.code).toBe('BOOKING_CONFLICT');
    expect(body.error.details.conflictingDates).toEqual([stay.checkIn, addDays(stay.checkIn, 1)]);

    const month = stay.checkIn.slice(0, 7);
    const availability = await (
      await getAvailability(
        get(`/api/listings/casita-001/availability?month=${month}`),
        idParams('casita-001'),
      )
    ).json();
    expect(availability.bookedDates).toContain(stay.checkIn);
  });

  it('409s for an overlapping (not identical) range, but allows back-to-back stays', async () => {
    const first = findFreeStay('casita-002', 3);
    await createBooking(post({ listingId: 'casita-002', ...guest, ...first }), noParams);

    const overlap = { checkIn: addDays(first.checkIn, 1), checkOut: addDays(first.checkOut, 2) };
    expect(
      (await createBooking(post({ listingId: 'casita-002', ...guest, ...overlap }), noParams))
        .status,
    ).toBe(409);

    const backToBack = { checkIn: first.checkOut, checkOut: addDays(first.checkOut, 1) };
    const booked = bookingsRepository.getBookedNights('casita-002', TODAY);
    if (!booked.has(backToBack.checkIn)) {
      expect(
        (await createBooking(post({ listingId: 'casita-002', ...guest, ...backToBack }), noParams))
          .status,
      ).toBe(201);
    }
  });

  it('400s on invalid payloads', async () => {
    const stay = findFreeStay('casita-001', 2);
    const cases: unknown[] = [
      '{not json',
      { listingId: 'casita-001' },
      { listingId: 'casita-001', ...guest, guestName: 'A', ...stay },
      { listingId: 'casita-001', ...guest, email: 'nope', ...stay },
      { listingId: 'casita-001', ...guest, checkIn: stay.checkOut, checkOut: stay.checkIn },
      { listingId: 'casita-001', ...guest, checkIn: '2020-01-01', checkOut: '2020-01-03' },
      { listingId: 'casita-001', ...guest, checkIn: '2030-01-01', checkOut: '2030-01-03' },
    ];
    for (const body of cases) {
      const response = await createBooking(post(body), noParams);
      expect(response.status, JSON.stringify(body)).toBe(400);
    }
  });

  it('400s when guests exceed the listing capacity', async () => {
    const stay = findFreeStay('casita-001', 2);
    const response = await createBooking(
      post({ listingId: 'casita-001', ...guest, guests: 20, ...stay }),
      noParams,
    );
    expect(response.status).toBe(400);
  });

  it('404s for an unknown listing', async () => {
    const stay = findFreeStay('casita-001', 2);
    const response = await createBooking(post({ listingId: 'nope', ...guest, ...stay }), noParams);
    expect(response.status).toBe(404);
  });
});

describe('simulateNetwork', () => {
  it('fails with a 5xx at the configured rate, before any handler work', async () => {
    const config = { latencyMin: 0, latencyMax: 0, failureRate: 1 };
    await expect(simulateNetwork(undefined, config)).rejects.toSatisfy(
      (e) => e instanceof AppError && e.status >= 500,
    );
  });

  it('never fails at rate 0 and fails always at rate 1 (rate is a probability)', async () => {
    const zero = { latencyMin: 0, latencyMax: 0, failureRate: 0 };
    await expect(simulateNetwork(undefined, zero, () => 0)).resolves.toBeUndefined();
    const some = { latencyMin: 0, latencyMax: 0, failureRate: 0.1 };
    await expect(simulateNetwork(undefined, some, () => 0.05)).rejects.toBeInstanceOf(AppError);
    await expect(simulateNetwork(undefined, some, () => 0.5)).resolves.toBeUndefined();
  });
});
