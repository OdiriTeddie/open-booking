# @openbooking/core

Pure TypeScript booking logic for Open Booking.

## What it does

- defines services and durations
- models weekly business availability
- supports date-specific availability overrides
- supports bounded recurring availability and blackout rules
- generates booking slots
- excludes conflicting bookings
- applies buffer time
- supports minimum notice and booking horizon rules
- supports blackout dates
- supports explicit business time zones
- validates timezone-safe booking inputs

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
  dateOverrides: [
    {
      date: "2026-07-14",
      windows: [{ start: "12:00", end: "16:00" }]
    }
  ],
  recurringAvailability: [
    {
      frequency: "weekly",
      weekdays: ["monday"],
      startDate: "2026-07-01",
      endDate: "2026-08-31",
      windows: [{ start: "18:00", end: "20:00" }]
    }
  ],
  recurringBlackoutRules: [
    {
      frequency: "weekly",
      weekdays: ["sunday"]
    }
  ],
  bookings: [],
  bufferMinutes: 15,
  minimumNoticeMinutes: 120,
  maxAdvanceDays: 30,
  blackoutDates: [],
  timeZone: "Europe/London"
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

## Time Zone Model

- `LocalDate` and `LocalTime` are interpreted in the configured business
  `timeZone`.
- booking and slot timestamps remain ISO date-times with an explicit `Z` or
  offset.
- if `timeZone` is omitted, the engine defaults to `UTC`.

## Availability Precedence

- `recurringAvailability` adds extra windows to the base weekly availability
  when a rule matches a date.
- `dateOverrides` replace weekly availability for the matching date.
- `blackoutDates` and `recurringBlackoutRules` still return no slots, even if a
  date override exists.

## Recurrence Model

- recurring rules currently support `frequency: "weekly"`.
- each rule can be bounded with `startDate` and `endDate`.
- recurring availability matches by weekday and adds windows for matching
  dates.
- recurring blackout rules match by weekday and suppress slot generation for
  matching dates.

## Booking Constraints

- `minimumNoticeMinutes` prevents near-term bookings.
- `maxAdvanceDays` limits how far into the future a slot can be booked.
- `now` can be supplied in tests or controlled environments to make constraint
  evaluation deterministic.
