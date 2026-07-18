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
- supports production booking caps per day and per service
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
  bookingRules: {
    maxBookingsPerDay: 12,
    maxBookingsPerServicePerDay: 4
  },
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
- `engine.getSlotsWithAvailability({ serviceId, date })`
- `engine.hasConflict(slot)`
- `engine.isSlotAvailable(slot)`
- `engine.getSlotAvailability(slot)`
- `engine.createBooking({ id, slot })`
- `engine.confirmBooking({ id, slot })`
- `engine.addBooking(booking)`
- `createBookingEngineFromRepository({ ...config, repository })`
- `confirmBookingWithVersion({ ...config, repository, expectedVersion, bookingId, slot })`

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

## Production Booking Rules

- `bookingRules.maxBookingsPerDay` caps total bookings that can start on the
  same local business date.
- `bookingRules.maxBookingsPerServicePerDay` caps bookings per service on the
  same local business date.
- daily caps are enforced during slot generation, direct availability checks,
  and booking creation.

## Confirmation Workflow

- `createBooking({ id, slot })` validates the slot and returns a booking shape.
- `confirmBooking({ id, slot })` performs final slot validation at booking time
  and returns an explicit result object.
- repeated `confirmBooking` calls with the same `id` and same slot return
  `status: "duplicate"` with the original booking.
- repeated `confirmBooking` calls with the same `id` and a different slot return
  `status: "unavailable"` with `reason: "duplicate-booking-id"`.

## Repository Interface

- `BookingRepositoryReader` defines `getSnapshot()`.
- `BookingRepositoryWriter` defines:
  - `saveBooking(booking)`
  - `saveHold(hold)`
  - `releaseHold(holdId)`
- `BookingRepository` combines both contracts.
- `createBookingEngineFromRepository({ ...config, repository })` hydrates a
  pure booking engine from persisted bookings and holds.
- repository writes are intentionally not hidden inside the core engine. The
  engine computes decisions; your application coordinates storage.

## Versioned Confirmation

- `VersionedBookingRepositoryReader` returns a snapshot with a `version`.
- `VersionedBookingRepositoryWriter` defines
  `commitBookingChange({ expectedVersion, booking, releaseHoldId? })`.
- `confirmBookingWithVersion(...)`:
  - loads a versioned snapshot from storage
  - validates the booking or held booking against that snapshot
  - attempts an optimistic-concurrency commit with `expectedVersion`
- if the stored version has changed, the result is
  `status: "unavailable"` with `reason: "version-mismatch"`.

## Availability Diagnostics

- `getSlotAvailability(slot)` returns `{ available, reason? }`.
- `getSlotsWithAvailability({ serviceId, date })` returns generated slots plus
  availability diagnostics for each slot.
- current unavailability reasons include:
  - `unknown-service`
  - `invalid-slot-duration`
  - `outside-availability`
  - `blackout-date`
  - `conflict`
  - `minimum-notice`
  - `max-advance`
  - `max-bookings-per-day`
  - `max-bookings-per-service-per-day`
