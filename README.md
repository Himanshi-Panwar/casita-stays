# Casita Stays

An accommodation booking application built with **Next.js 16, TypeScript, Material UI, and TanStack Query**. Users can search accommodation listings, view property details, check availability, calculate booking prices, and create reservations with booking-conflict validation.

## Tech Stack

- **Next.js 16 (App Router):** Routing, server rendering, and API route handlers.
- **TypeScript:** Type safety and maintainable code.
- **Material UI:** Reusable UI components and responsive layouts.
- **TanStack Query:** Client-side API data management, caching, and cache invalidation.
- **React Hook Form and Zod:** Form handling and validation.
- **Vitest, React Testing Library, and Playwright:** Unit, component, and end-to-end testing.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint |
| `npm run format:check` | Check code formatting |
| `npm test` | Run unit and integration tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |

## Key Features

- Search listings by city, price, and guest capacity.
- Sort and paginate search results.
- View property details, images, amenities, and host information.
- Check availability using a multi-month calendar.
- Calculate booking costs, including cleaning and service fees.
- Submit reservations with date validation and conflict handling.
- Handle loading states, API errors, and retry actions.

## Architecture

- `app/` — Routes, layouts, and API handlers.
- `components/` — Shared UI components.
- `features/` — Search, listing, and booking features.
- `domain/` — Business rules, validation, pricing, and date utilities.
- `lib/` — API clients, query configuration, and server services.
- `mocks/` — Mock listing and reservation data.
- `theme/` — Material UI theme and styling configuration.
- `tests/` — Unit, component, and end-to-end tests.

The application separates UI components, business logic, and data access to make the code easier to test and maintain.

## Data and Rendering

- Search filters, sorting, and pagination are reflected in the URL.
- TanStack Query manages interactive API data and caching.
- Local component state handles temporary UI interactions.
- React Hook Form and Zod handle booking form input and validation.
- Server Components handle server-rendered content, while Client Components support interactive features.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/listings` | Search, filter, sort, and paginate listings |
| GET | `/api/listings/:id` | Retrieve listing details |
| GET | `/api/listings/:id/availability?month=YYYY-MM` | Retrieve booked dates |
| POST | `/api/bookings` | Create a reservation |

The application uses mock data rather than a persistent database. Booking requests validate the requested stay and handle conflicts with HTTP `409` responses.

## Booking Rules

- Check-in is included in the stay; check-out is excluded from occupied nights.
- Reservations cannot overlap unavailable nights.
- The total includes nightly charges, a cleaning fee, and a service fee.
- Dates use `YYYY-MM-DD` calendar-day strings to avoid timezone-related date shifts.
- Booking data is validated on both the client and server.

## Testing

Tests cover search and filtering, date calculations, pricing, booking validation, API responses, and user interactions. End-to-end tests are available through Playwright.

Run `npm test` for unit and integration tests, or `npm run test:e2e` for browser-based tests.

## Known Limitations

- Listings and bookings use mock, in-memory data.
- Reservations are not persisted to a database.
- Authentication, payment processing, and email delivery are not implemented.
- Some listing images are placeholders.

## Future Improvements

- Integrate a persistent database and backend services.
- Add authentication and payment processing.
- Improve image loading and reduce client-side JavaScript.
- Add visual regression and automated accessibility testing.
- Introduce booking idempotency and database-level conflict protection.