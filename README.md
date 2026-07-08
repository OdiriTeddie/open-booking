# Open Booking

Open Booking is a lightweight, framework-agnostic, headless booking engine for small business websites.

It is not a Calendly clone. The core package focuses on pure scheduling logic: services, weekly availability, booking conflicts, buffers, blackout dates, and slot generation. Framework packages adapt that logic for React first, with Vue/Nuxt planned later.

## Packages

- `@openbooking/core`: Pure TypeScript booking engine with no framework, DOM, or browser dependencies.
- `@openbooking/react`: React hook and starter components backed by `@openbooking/core`.
- `@openbooking/vue`: Placeholder package for future Vue composables/components.
- `@openbooking/ui`: Optional shared CSS and UI primitives.
- `@openbooking/docs`: Vite + React demo app.

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
  date: "2026-07-13"
});
```
