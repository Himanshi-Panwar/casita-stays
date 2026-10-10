// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as listBookings, POST as createBooking } from '@/app/api/bookings/route';
import { DELETE as removeWishlist } from '@/app/api/wishlist/[listingId]/route';
import { GET as listWishlist, POST as addWishlist } from '@/app/api/wishlist/route';
import { bookingsRepository } from '@/mocks/bookings';
import { wishlistRepository } from '@/mocks/wishlist';

const noParams = { params: Promise.resolve({}) };
const post = (url: string, body: unknown) =>
  new Request(`http://test${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeAll(() => {
  vi.stubEnv('MOCK_FAILURE_RATE', '0');
  vi.stubEnv('MOCK_LATENCY_MIN', '0');
  vi.stubEnv('MOCK_LATENCY_MAX', '0');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-03-10T12:00:00Z'));
});
afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
beforeEach(() => {
  bookingsRepository.reset();
  wishlistRepository.reset();
});

describe('GET /api/bookings', () => {
  it('is empty at first, then lists a created booking (newest first) with status', async () => {
    expect(
      (await (await listBookings(new Request('http://test/api/bookings'), noParams)).json()).items,
    ).toEqual([]);

    const base = { guestName: 'Ana Souza', email: 'ana@example.com', guests: 1 };
    // Far enough out to be free for any seeded reservation pattern on these listings.
    const booked = bookingsRepository.getBookedNights('casita-020', '2026-03-10');
    let day = 11;
    const date = (n: number) => `2026-03-${String(n).padStart(2, '0')}`;
    while (booked.has(date(day)) || booked.has(date(day + 1))) day++;
    const res = await createBooking(
      post('/api/bookings', {
        listingId: 'casita-020',
        ...base,
        checkIn: date(day),
        checkOut: date(day + 2),
      }),
      noParams,
    );
    expect(res.status).toBe(201);

    const body = await (
      await listBookings(new Request('http://test/api/bookings'), noParams)
    ).json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      listingId: 'casita-020',
      status: 'confirmed',
      guests: 1,
    });
    expect(body.items[0].price.total).toBeGreaterThan(0);
  });
});

describe('wishlist API', () => {
  const list = async () =>
    (await (await listWishlist(new Request('http://test/api/wishlist'), noParams)).json())
      .items as { id: string }[];
  const remove = (id: string) =>
    removeWishlist(new Request(`http://test/api/wishlist/${id}`, { method: 'DELETE' }), {
      params: Promise.resolve({ listingId: id }),
    });

  it('adds, lists (newest first, as listing summaries) and removes', async () => {
    expect(await list()).toEqual([]);
    expect(
      (await addWishlist(post('/api/wishlist', { listingId: 'casita-001' }), noParams)).status,
    ).toBe(201);
    await addWishlist(post('/api/wishlist', { listingId: 'casita-002' }), noParams);
    const items = await list();
    expect(items.map((i) => i.id)).toEqual(['casita-002', 'casita-001']);
    expect(items[0]).toHaveProperty('coverImage');

    expect((await remove('casita-002')).status).toBe(200);
    expect((await list()).map((i) => i.id)).toEqual(['casita-001']);
  });

  it('is idempotent: duplicate add and removing a missing id both succeed', async () => {
    await addWishlist(post('/api/wishlist', { listingId: 'casita-001' }), noParams);
    expect(
      (await addWishlist(post('/api/wishlist', { listingId: 'casita-001' }), noParams)).status,
    ).toBe(201);
    expect(await list()).toHaveLength(1);
    expect((await remove('casita-999')).status).toBe(200);
  });

  it('404s for an unknown listing and 400s for a bad body', async () => {
    expect((await addWishlist(post('/api/wishlist', { listingId: 'nope' }), noParams)).status).toBe(
      404,
    );
    expect((await addWishlist(post('/api/wishlist', {}), noParams)).status).toBe(400);
  });
});

describe('legacy records', () => {
  it('lists bookings stored before `status` existed instead of failing the whole list', async () => {
    const legacy = {
      id: 'CSA-LEGACY1',
      listingId: 'casita-001',
      listingTitle: 'Old',
      listingCity: 'Lisbon',
      listingImage: 'https://picsum.photos/seed/x/10/10',
      guestName: 'Ana',
      email: 'a@example.com',
      guests: 1,
      checkIn: '2026-03-20',
      checkOut: '2026-03-22',
      price: {
        nights: 2,
        pricePerNight: 100,
        subtotal: 200,
        cleaningFee: 40,
        serviceFee: 20,
        total: 260,
      },
      createdAt: '2026-03-01T00:00:00.000Z',
    };
    bookingsRepository.insert(legacy as unknown as Parameters<typeof bookingsRepository.insert>[0]);
    const { items } = await (
      await listBookings(new Request('http://test/api/bookings'), noParams)
    ).json();
    expect(items[0]).toMatchObject({ id: 'CSA-LEGACY1', status: 'confirmed' });
  });
});
