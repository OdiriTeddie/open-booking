# @openbooking/core

Pure TypeScript booking logic for Open Booking.

## What it does

- defines services and durations
- models weekly business availability
- generates booking slots
- excludes conflicting bookings
- applies buffer time
- supports blackout dates
- validates UTC-safe booking inputs

## What it does not do

- React rendering
- Vue rendering
- DOM access
- browser-only APIs

## Install

```bash
pnpm add @openbooking/core
```

## Example

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

## Public API

- `createBookingEngine(config)`
- `engine.getServices()`
- `engine.getService(serviceId)`
- `engine.getAvailabilityForDate(date)`
- `engine.getAvailableSlots({ serviceId, date })`
- `engine.hasConflict(slot)`
- `engine.isSlotAvailable(slot)`
- `engine.createBooking({ id, slot })`
- `engine.addBooking(booking)`
