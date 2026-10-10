import { type APIRequestContext, type Page, expect, test } from '@playwright/test';
import { findConflicts } from '../../domain/availability';
import { addDays, monthsFrom, todayISO } from '../../domain/dates';

/** First free `nights`-night stay for a listing, derived from the real availability API. */
async function findFreeStay(request: APIRequestContext, listingId: string, nights: number) {
  const today = todayISO();
  const booked = new Set<string>();
  for (const month of monthsFrom(today, 3)) {
    const response = await request.get(`/api/listings/${listingId}/availability?month=${month}`);
    const body = (await response.json()) as { bookedDates: string[] };
    body.bookedDates.forEach((d) => booked.add(d));
  }
  for (let offset = 1; offset < 70; offset++) {
    const checkIn = addDays(today, offset);
    const checkOut = addDays(checkIn, nights);
    if (findConflicts(checkIn, checkOut, booked).length === 0) return { checkIn, checkOut };
  }
  throw new Error('No free stay found');
}

async function pickDates(page: Page, stay: { checkIn: string; checkOut: string }) {
  // Wait for availability: days only become enabled once all months have loaded.
  const first = page.locator(`[data-date="${stay.checkIn}"]`);
  await expect(first).toHaveAttribute('aria-disabled', 'false');
  await first.click();
  await page.locator(`[data-date="${stay.checkOut}"]`).click();
}

async function fillGuest(page: Page) {
  await page.getByLabel('Full name').fill('Ana Souza');
  await page.getByLabel('Email').fill('ana@example.com');
}

test.describe('search', () => {
  test('filters, sort and pagination live in the URL and survive a reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('article')).toHaveCount(20);

    await page.getByLabel('Where to?').fill('Kyoto');
    await expect(page).toHaveURL(/city=Kyoto/);
    await expect(page.locator('article').first()).toContainText('Kyoto');
    for (const text of await page.locator('article').allTextContents())
      expect(text).toContain('Kyoto');

    await page.getByLabel('Sort by').selectOption('price_asc');
    await expect(page).toHaveURL(/sort=price_asc/);

    await page.getByRole('link', { name: 'Go to page 2' }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/Showing 21–/)).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Where to?')).toHaveValue('Kyoto');
    await expect(page.getByLabel('Sort by')).toHaveValue('price_asc');
    await expect(page).toHaveURL(/page=2/);
  });

  test('shows an empty state with a way out', async ({ page }) => {
    await page.goto('/?city=Atlantis');
    await expect(page.getByRole('heading', { name: 'No stays match your filters' })).toBeVisible();
    await page.getByRole('link', { name: 'Clear all filters' }).first().click();
    await expect(page.locator('article')).toHaveCount(20);
  });

  test('a garbage URL degrades to defaults instead of erroring', async ({ page }) => {
    await page.goto('/?page=-5&sort=banana&minPrice=abc');
    await expect(page.locator('article')).toHaveCount(20);
  });
});

test.describe('listing + booking', () => {
  test('book a stay end to end', async ({ page, request }) => {
    let id = 'casita-010';

    // Reach the listing the way a user would: from search results.
    await page.goto('/?city=Lisbon');
    await page.locator('article h3 a').first().click();
    await expect(page).toHaveURL(/\/listings\//);
    const listingId = new URL(page.url()).pathname.split('/').pop()!;
    const stayForListing = await findFreeStay(request, listingId, 2);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'About this place' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your host' })).toBeVisible();

    id = listingId;
    const stay = stayForListing;
    await pickDates(page, stay);
    await expect(page.getByTestId('selection-summary')).toContainText('2 nights');
    await expect(page.getByText('Cleaning fee')).toBeVisible();
    await expect(page.getByText('Service fee (10%)')).toBeVisible();

    await fillGuest(page);
    await page.getByRole('button', { name: /^Reserve/ }).click();

    await expect(page).toHaveURL(/\/booking\/confirmation\?id=CSA-/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('You’re booked');
    await expect(page.getByTestId('booking-id')).toHaveText(/^CSA-/);
    await expect(page.getByText('Total')).toBeVisible();

    // The booked nights are now unavailable on the listing page.
    await page.goto(`/listings/${id}`);
    await expect(page.locator(`[data-date="${stay.checkIn}"]`)).toHaveAttribute(
      'aria-label',
      /unavailable, booked/,
    );
  });

  test('409: someone else books the dates first → refresh, explain, re-pick', async ({
    page,
    request,
  }) => {
    const id = 'casita-011';
    const stay = await findFreeStay(request, id, 2);

    await page.goto(`/listings/${id}`);
    await pickDates(page, stay);
    await fillGuest(page);

    // A competing guest books the same nights while our form is open.
    const rival = await request.post('/api/bookings', {
      data: {
        listingId: id,
        guestName: 'Rival Guest',
        email: 'rival@example.com',
        guests: 1,
        ...stay,
      },
    });
    expect(rival.status()).toBe(201);

    await page.getByRole('button', { name: /^Reserve/ }).click();
    await expect(
      page.getByRole('form', { name: 'Book this stay' }).getByRole('alert'),
    ).toContainText(/just booked by someone else/i);
    await expect(page.locator(`[data-date="${stay.checkIn}"]`)).toHaveAttribute(
      'aria-label',
      /unavailable, booked/,
    );
    await expect(page.getByTestId('selection-summary')).toContainText(/choose your check-in/i);
    await expect(page.getByLabel('Full name')).toHaveValue('Ana Souza');
    await expect(page).toHaveURL(new RegExp(`/listings/${id}$`));

    // …and the user can pick different dates and complete the booking.
    const next = await findFreeStay(request, id, 2);
    await pickDates(page, next);
    await page.getByRole('button', { name: /^Reserve/ }).click();
    await expect(page).toHaveURL(/\/booking\/confirmation/);
  });

  test('range selection cannot cross a booked date', async ({ page }) => {
    const id = 'casita-012';
    await page.goto(`/listings/${id}`);
    const booked = page.locator('button[aria-label$="unavailable, booked"]').first();
    await expect(booked).toBeVisible();
    const bookedDate = (await booked.getAttribute('data-date'))!;

    // Pick the free night two days before the booked block; the booked day's *successors* are blocked.
    const before = addDays(bookedDate, -2);
    const start = page.locator(`[data-date="${before}"]`);
    if ((await start.getAttribute('aria-disabled')) === 'false') {
      await start.click();
      await expect(page.locator(`[data-date="${addDays(bookedDate, 3)}"]`)).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
  });

  test('calendar is keyboard operable', async ({ page, request }) => {
    const id = 'casita-013';
    const stay = await findFreeStay(request, id, 1);
    await page.goto(`/listings/${id}`);
    await expect(page.locator(`[data-date="${stay.checkIn}"]`)).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    await page.locator(`[data-date="${stay.checkIn}"]`).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('selection-summary')).toContainText(/Check-in/);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`[data-date="${stay.checkOut}"]`)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('selection-summary')).toContainText('1 night');
  });

  test('unknown listing and unknown booking show friendly pages', async ({ page }) => {
    await page.goto('/listings/does-not-exist');
    await expect(page.getByRole('heading', { name: 'That stay doesn’t exist' })).toBeVisible();
    await page.goto('/booking/confirmation?id=CSA-NOPE');
    await expect(
      page.getByRole('heading', { name: 'We couldn’t find that booking' }),
    ).toBeVisible();
  });
});

test.describe('my bookings + wishlist', () => {
  test('a new booking appears on /bookings with its details', async ({ page, request }) => {
    const id = 'casita-014';
    const stay = await findFreeStay(request, id, 2);
    await page.goto(`/listings/${id}`);
    await pickDates(page, stay);
    await fillGuest(page);
    await page.getByRole('button', { name: /^Reserve/ }).click();
    await expect(page).toHaveURL(/\/booking\/confirmation\?id=CSA-/);
    const bookingId = (await page.getByTestId('booking-id').textContent())!;

    await page.getByRole('link', { name: 'My bookings' }).click();
    await expect(page).toHaveURL(/\/bookings$/);
    const card = page.locator('article', { hasText: bookingId });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Confirmed');
    await expect(card).toContainText('1 guest');
    await expect(card.getByRole('link', { name: 'View Listing' })).toHaveAttribute(
      'href',
      `/listings/${id}`,
    );
    await expect(card.getByRole('img')).toBeVisible();
  });

  test('wishlist: add from a card and the details page, see it on /wishlist, remove it', async ({
    page,
  }) => {
    await page.goto('/wishlist');
    await expect(page.getByRole('heading', { name: 'Your wishlist is empty' })).toBeVisible();

    await page.goto('/?city=Kyoto');
    const first = page.locator('article').first();
    const title = (await first.locator('h3').textContent())!;
    const heart = first.getByRole('button', { name: `Save ${title} to wishlist` });
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/wishlist');
    const saved = page.locator('article', { hasText: title });
    await expect(saved).toBeVisible();

    // Remove from the wishlist page.
    await saved.getByRole('button', { name: /to wishlist/ }).click();
    await expect(page.getByRole('heading', { name: 'Your wishlist is empty' })).toBeVisible();

    // Details page heart.
    await page.goto('/listings/casita-005');
    const save = page.getByRole('button', { name: /to wishlist/ });
    await save.click();
    await expect(save).toHaveText('Saved');
    await page.reload();
    await expect(page.getByRole('button', { name: /to wishlist/ })).toHaveText('Saved');
  });
});
