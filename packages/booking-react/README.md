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
- `BookingCalendar`
- `ServiceSelector`
- `TimeSlots`
- `BookingForm`
- `BookingSummary`

## Example

```tsx
import { BookingCalendar, ServiceSelector, TimeSlots, useBooking } from "@openbooking/react";

const booking = useBooking({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  initialDate: "2026-07-10"
});
```

## Scope

- React state and composition
- starter booking UI
- no booking rules beyond what comes from `@openbooking/core`
