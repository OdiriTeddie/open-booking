# @openbooking/react

React bindings for Open Booking.

`@openbooking/react` adapts `@openbooking/core` for React with hooks and starter
components. Scheduling logic stays in the core package.

## Install

```bash
pnpm add @openbooking/react @openbooking/core react
```

## Exports

- `useBooking`
- `useBookingConfirmation`
- `BookingCalendar`
- `ServiceSelector`
- `TimeSlots`
- `BookingForm`
- `BookingSummary`

## Example

```tsx
import {
  BookingCalendar,
  ServiceSelector,
  TimeSlots,
  useBooking,
  useBookingConfirmation
} from "@openbooking/react";

const booking = useBooking({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  initialDate: "2026-07-24"
});

const confirmation = useBookingConfirmation({
  createHold: (input) => api.createHold(input),
  confirmHeldBooking: (input) => api.confirmHeldBooking(input)
});
```

## Client And Server Flow

`@openbooking/react` handles local selection state and calls your backend for
hold and confirm actions. Keep final booking validation on the server with
`@openbooking/core`.

```tsx
import { useBooking, useBookingConfirmation } from "@openbooking/react";

const booking = useBooking({
  services,
  availability,
  bookings,
  initialDate: "2026-07-24"
});

const confirmation = useBookingConfirmation({
  createHold: (input) =>
    fetch("/api/booking/hold", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    }).then((response) => response.json()),
  confirmHeldBooking: (input) =>
    fetch("/api/booking/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    }).then((response) => response.json())
});
```

Server route example:

```ts
import { confirmBookingWithRetry } from "@openbooking/core";

const result = await confirmBookingWithRetry({
  services,
  availability,
  repository,
  bookingId: input.bookingId,
  holdId: input.holdId,
  slot: input.slot,
  now: "2026-07-18T12:05:00.000Z",
  maxVersionRetries: 1
});
```

## Scope

- React state and composition
- starter booking UI
- server action orchestration for hold and confirm flows
- no booking rules beyond what comes from `@openbooking/core`
