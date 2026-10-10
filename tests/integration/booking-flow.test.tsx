import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingExperience } from '@/features/booking/BookingExperience';
import { theme } from '@/theme/theme';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

const TODAY = '2026-03-01';
const listing = { id: 'casita-001', title: 'Test Casita', pricePerNight: 100, maxGuests: 4 };

interface ServerState {
  booked: string[];
  /** Responds to the next POST. */
  bookingResponse: () => Response;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const bookingBody = {
  id: 'CSA-TEST1234',
  listingId: listing.id,
  listingTitle: listing.title,
  listingCity: 'Lisbon',
  listingImage: 'https://picsum.photos/seed/x/10/10',
  guestName: 'Ana Souza',
  email: 'ana@example.com',
  guests: 2,
  checkIn: '2026-03-10',
  checkOut: '2026-03-13',
  price: {
    nights: 3,
    pricePerNight: 100,
    subtotal: 300,
    cleaningFee: 40,
    serviceFee: 30,
    total: 370,
  },
  status: 'confirmed',
  createdAt: '2026-03-01T00:00:00.000Z',
};

let server: ServerState;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  push.mockClear();
  server = { booked: [], bookingResponse: () => json(bookingBody, 201) };
  fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === 'POST') return server.bookingResponse();
    const month = /month=(\d{4}-\d{2})/.exec(url)?.[1];
    if (month) {
      return json({
        listingId: listing.id,
        month,
        bookedDates: server.booked.filter((d) => d.startsWith(month)),
      });
    }
    return json({ error: { code: 'NOT_FOUND', message: 'nope' } }, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
});

function renderExperience(children: ReactNode = <p>Server content</p>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <BookingExperience listing={listing} today={TODAY}>
          {children}
        </BookingExperience>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

const availabilityCalls = () =>
  fetchMock.mock.calls.filter(
    ([url, init]) => String(url).includes('/availability') && init?.method !== 'POST',
  ).length;

const day = (label: string) => screen.getByRole('button', { name: new RegExp(label) });

async function waitForCalendar() {
  // Days become selectable only once all three months have loaded.
  await waitFor(() => expect(day('March 10, 2026')).toHaveAttribute('aria-disabled', 'false'));
}

async function pickStay(
  user: ReturnType<typeof userEvent.setup>,
  from = 'March 10, 2026',
  to = 'March 13, 2026',
) {
  await user.click(day(from));
  await user.click(day(to));
}

async function fillGuest(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Full name'), 'Ana Souza');
  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
}

describe('booking flow', () => {
  it('fetches availability for the next 3 months in parallel', async () => {
    renderExperience();
    await waitForCalendar();
    const months = fetchMock.mock.calls.map(
      ([url]) => /month=(\d{4}-\d{2})/.exec(String(url))?.[1],
    );
    expect(months.sort()).toEqual(['2026-03', '2026-04', '2026-05']);
    expect(screen.getByText('Server content')).toBeInTheDocument();
  });

  it('shows a live price breakdown once dates are chosen', async () => {
    const user = userEvent.setup();
    renderExperience();
    await waitForCalendar();
    expect(screen.getByText(/select your dates to see the full price/i)).toBeInTheDocument();

    await pickStay(user);

    expect(screen.getByTestId('selection-summary')).toHaveTextContent('3 nights');
    const breakdown = screen.getByText('Cleaning fee').closest('dl') as HTMLElement;
    expect(within(breakdown).getByText('$100.00 × 3 nights')).toBeInTheDocument();
    expect(within(breakdown).getByText('$300.00')).toBeInTheDocument();
    expect(within(breakdown).getByText('$40.00')).toBeInTheDocument();
    expect(within(breakdown).getByText('$30.00')).toBeInTheDocument();
    expect(within(breakdown).getByText('$370.00')).toBeInTheDocument();
  });

  it('submits the booking and navigates to the confirmation page', async () => {
    const user = userEvent.setup();
    renderExperience();
    await waitForCalendar();
    await pickStay(user);
    await fillGuest(user);
    await user.click(screen.getByRole('button', { name: /reserve/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/booking/confirmation?id=CSA-TEST1234'));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(post?.[1]?.body as string)).toEqual({
      listingId: 'casita-001',
      guestName: 'Ana Souza',
      email: 'ana@example.com',
      guests: 1,
      checkIn: '2026-03-10',
      checkOut: '2026-03-13',
    });
  });

  it('shows field errors and does not call the API when the form is invalid', async () => {
    const user = userEvent.setup();
    renderExperience();
    await waitForCalendar();
    await user.click(screen.getByRole('button', { name: /reserve/i }));

    expect(await screen.findByText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
    expect(screen.getByText('Choose a check-in date.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('disables booked dates and any check-out that would cross them', async () => {
    server.booked = ['2026-03-12', '2026-03-13'];
    const user = userEvent.setup();
    renderExperience();
    await waitFor(() => expect(day('March 12, 2026')).toBeInTheDocument());
    await waitFor(() => expect(day('March 10, 2026')).toHaveAttribute('aria-disabled', 'false'));

    expect(day('March 12, 2026')).toHaveAttribute('aria-disabled', 'true');
    expect(day('March 12, 2026')).toHaveAccessibleName(/unavailable, booked/);

    await user.click(day('March 10, 2026'));
    // The first booked night can still be a check-out; anything beyond it cannot.
    expect(day('March 12, 2026')).toHaveAttribute('aria-disabled', 'false');
    expect(day('March 12, 2026')).toHaveAccessibleName(/check-out only/);
    expect(day('March 15, 2026')).toHaveAttribute('aria-disabled', 'true');

    await user.click(day('March 15, 2026'));
    expect(screen.getByTestId('selection-summary')).toHaveTextContent(/now choose your check-out/i);
  });

  it('on 409: refreshes availability, explains, and lets the user choose new dates', async () => {
    const user = userEvent.setup();
    renderExperience();
    await waitForCalendar();
    await pickStay(user);
    await fillGuest(user);

    // Someone else books those nights before we submit.
    server.booked = ['2026-03-10', '2026-03-11', '2026-03-12'];
    server.bookingResponse = () =>
      json(
        {
          error: {
            code: 'BOOKING_CONFLICT',
            message: 'Those dates are no longer available.',
            details: { conflictingDates: server.booked },
          },
        },
        409,
      );
    const callsBefore = availabilityCalls();

    await user.click(screen.getByRole('button', { name: /reserve/i }));

    // 1. explains that availability changed
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/just booked by someone else/i);

    // 2. refreshed availability from the API (all 3 months invalidated)
    expect(availabilityCalls()).toBeGreaterThanOrEqual(callsBefore + 3);

    // 3. calendar now shows the dates as taken, and the stale selection was cleared
    await waitFor(() => expect(day('March 11, 2026')).toHaveAccessibleName(/unavailable, booked/));
    expect(screen.getByTestId('selection-summary')).toHaveTextContent(/choose your check-in/i);
    expect(screen.getByLabelText('Check-in')).toHaveValue('');
    expect(push).not.toHaveBeenCalled();

    // 4. the user can pick new dates and rebook
    server.bookingResponse = () =>
      json({ ...bookingBody, checkIn: '2026-03-20', checkOut: '2026-03-22' }, 201);
    await pickStay(user, 'March 20, 2026', 'March 22, 2026');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /reserve/i }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    // Guest details were preserved across the conflict.
    expect(screen.getByLabelText('Full name')).toHaveValue('Ana Souza');
  });

  it('on a server error: shows a retryable message and keeps the user’s input', async () => {
    const user = userEvent.setup();
    renderExperience();
    await waitForCalendar();
    await pickStay(user);
    await fillGuest(user);

    server.bookingResponse = () =>
      json({ error: { code: 'INTERNAL_ERROR', message: 'boom' } }, 500);
    await user.click(screen.getByRole('button', { name: /reserve/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/haven’t been charged.*try again/i);
    expect(screen.getByLabelText('Full name')).toHaveValue('Ana Souza');
    expect(screen.getByTestId('selection-summary')).toHaveTextContent('3 nights');
    expect(push).not.toHaveBeenCalled();

    // Retrying (a manual resubmit) works once the server recovers.
    server.bookingResponse = () => json(bookingBody, 201);
    await user.click(screen.getByRole('button', { name: /reserve/i }));
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
  });

  it('disables the submit button while the request is pending (no double booking)', async () => {
    const user = userEvent.setup();
    renderExperience();
    await waitForCalendar();
    await pickStay(user);
    await fillGuest(user);

    let release: (r: Response) => void = () => {};
    server.bookingResponse = () => new Response(null);
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => (release = resolve)));
    // The mock above only intercepts the *next* call, which is the POST.
    await user.click(screen.getByRole('button', { name: /reserve/i }));

    const pending = await screen.findByRole('button', { name: /reserving/i });
    expect(pending).toBeDisabled();
    release(json(bookingBody, 201));
    await waitFor(() => expect(push).toHaveBeenCalled());
  });

  it('shows an error with a retry for a month that failed to load', async () => {
    const original = fetchMock.getMockImplementation() as (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => Promise<Response>;
    let failApril = true;
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (failApril && String(input).includes('month=2026-04')) {
        return json({ error: { code: 'INTERNAL_ERROR', message: 'boom' } }, 500);
      }
      return original(input, init);
    });
    const user = userEvent.setup();
    renderExperience();

    expect(
      await screen.findByText(/couldn’t load availability for April 2026/i),
    ).toBeInTheDocument();
    // Nothing is selectable while any month is unknown: ranges may span months.
    expect(day('March 10, 2026')).toHaveAttribute('aria-disabled', 'true');

    failApril = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitForCalendar();
    expect(screen.queryByText(/couldn’t load availability/i)).not.toBeInTheDocument();
  });
});
