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

## Scope

- React state and composition
- starter booking UI
- server action orchestration for hold and confirm flows
- no booking rules beyond what comes from `@openbooking/core`
