# Open Booking

Open Booking is a lightweight, framework-agnostic, headless booking engine for small business websites.

It is not a Calendly clone. The core package focuses on pure scheduling logic: services, weekly availability, booking conflicts, buffers, blackout dates, recurrence, booking constraints, production booking caps, and slot generation. Framework packages adapt that logic for React first, with Vue/Nuxt planned later.

## Packages

- `@openbooking/core`: Pure TypeScript booking engine with no framework, DOM, or browser dependencies.
- `@openbooking/react`: React hook and starter components backed by `@openbooking/core`.
- `@openbooking/vue`: Placeholder package for future Vue composables/components.
- `@openbooking/ui`: Optional shared CSS and UI primitives.
- `@openbooking/docs`: Vite + React demo app.

## Contributing

See `CONTRIBUTING.md` for workspace expectations, verification steps, and pull
request guidelines.

## Quick Start

```bash
pnpm install
pnpm test
pnpm dev
```

```ts
import { createBookingEngine } from "@openbooking/core";

const engine = createBookingEngine({
  services: [{ id: "consultation", name: "Consultation", durationMinutes: 30 }],
  availability: {
    monday: [{ start: "09:00", end: "17:00" }]
  },
  bookings: [],
  bufferMinutes: 15,
  blackoutDates: []
});

const slots = engine.getAvailableSlots({
  serviceId: "consultation",
  date: "2026-07-20"
});
```

## Core API

`@openbooking/core` is the source of truth for scheduling logic. It has no React,
Vue, browser, DOM, or UI dependencies.

```ts
const services = engine.getServices();

const availability = engine.getAvailabilityForDate("2026-07-20");

const slots = engine.getAvailableSlots({
  serviceId: "consultation",
  date: "2026-07-20"
});

const isAvailable = engine.isSlotAvailable(slots[0]);

const booking = engine.createBooking({
  id: "booking-1",
  slot: slots[0]
});

const nextEngine = engine.addBooking(booking);
```

## React And API Flow

The intended production split is:

- `@openbooking/react` for service/date/slot selection and form state
- your backend for hold creation and final confirmation
- `@openbooking/core` on the server for final slot validation and optimistic concurrency

```ts
import { confirmBookingWithRetry } from "@openbooking/core";

const confirmation = await confirmBookingWithRetry({
  services,
  availability,
  repository,
  bookingId: "booking-42",
  holdId: "hold-42",
  slot,
  now: "2026-07-18T12:05:00.000Z",
  maxVersionRetries: 1
});
```

Use `useBookingConfirmation(...)` in React to call those backend endpoints,
while keeping conflict checks and final booking rules in core.

### Time Types

- `LocalDate`: `YYYY-MM-DD`
- `LocalTime`: `HH:mm`
- `IsoDateTime`: ISO datetime with `Z` or an explicit offset

The MVP runs in UTC mode only. Invalid dates, loose time strings, missing timezone
offsets, duplicate service IDs, and invalid bookings are rejected by the core
engine.
