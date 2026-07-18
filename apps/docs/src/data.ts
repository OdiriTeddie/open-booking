import {
  buildExpressConfirmSnippet,
  buildFastifyConfirmSnippet,
  buildNextJsConfirmSnippet
} from "./snippets";

export const demoDateConfig = {
  diagnostics: {
    mixed: "2026-07-24",
    capacity: "2026-07-25",
    blackout: "2026-08-01"
  },
  clock: {
    browseNow: "2026-07-24T08:15:00.000Z",
    confirmNow: "2026-07-24T12:05:00.000Z",
    holdExpiresAt: "2026-07-24T12:10:00.000Z"
  },
  fallbackSlot: {
    start: "2026-07-24T10:00:00.000Z",
    end: "2026-07-24T10:30:00.000Z"
  }
} as const;

export const services = [
  { id: "consultation", name: "Consultation", durationMinutes: 30 },
  { id: "portrait-session", name: "Portrait Session", durationMinutes: 60 },
  { id: "brand-shoot", name: "Brand Shoot", durationMinutes: 90 }
] as const;

export const availability = {
  monday: [{ start: "09:00", end: "17:00" }],
  tuesday: [{ start: "09:00", end: "17:00" }],
  wednesday: [{ start: "11:00", end: "18:00" }],
  friday: [{ start: "09:00", end: "15:00" }],
  saturday: [{ start: "10:00", end: "14:00" }]
} as const;

export const bookings = [
  {
    id: "booking-1",
    serviceId: "portrait-session",
    start: "2026-07-24T10:00:00.000Z",
    end: "2026-07-24T11:00:00.000Z"
  },
  {
    id: "booking-2",
    serviceId: "consultation",
    start: "2026-07-25T11:30:00.000Z",
    end: "2026-07-25T12:00:00.000Z"
  },
  {
    id: "booking-3",
    serviceId: "brand-shoot",
    start: "2026-07-25T10:00:00.000Z",
    end: "2026-07-25T11:30:00.000Z"
  },
  {
    id: "booking-4",
    serviceId: "portrait-session",
    start: "2026-07-25T12:00:00.000Z",
    end: "2026-07-25T13:00:00.000Z"
  }
] as const;

export const integrationGuides = [
  {
    id: "nextjs",
    label: "Next.js",
    title: "Next.js route handler",
    description:
      "Use a route handler or server action to confirm the held slot against the latest repository snapshot.",
    snippet: buildNextJsConfirmSnippet(demoDateConfig.clock.confirmNow)
  },
  {
    id: "express",
    label: "Express",
    title: "Express POST handler",
    description:
      "Keep hold creation and final confirmation in API handlers while React calls them through useBookingConfirmation.",
    snippet: buildExpressConfirmSnippet(demoDateConfig.clock.confirmNow)
  },
  {
    id: "fastify",
    label: "Fastify",
    title: "Fastify route",
    description:
      "Use the same core helper inside a typed Fastify route to keep concurrency handling consistent across adapters.",
    snippet: buildFastifyConfirmSnippet(demoDateConfig.clock.confirmNow)
  }
] as const;

export const coreApiGroups = [
  {
    title: "Engine creation",
    items: [
      "createBookingEngine(config)",
      "createBookingEngineFromRepository({ ...config, repository })",
      "loadBookingEngineFromRepository({ ...config, repository })"
    ]
  },
  {
    title: "Availability and diagnostics",
    items: [
      "engine.getServices()",
      "engine.getService(serviceId)",
      "engine.getAvailabilityForDate(date)",
      "engine.getAvailableSlots({ serviceId, date })",
      "engine.getSlotsWithAvailability({ serviceId, date })",
      "engine.getSlotAvailability(slot)",
      "engine.isSlotAvailable(slot)",
      "engine.hasConflict(slot)"
    ]
  },
  {
    title: "Booking workflows",
    items: [
      "engine.createBooking({ id, slot })",
      "engine.confirmBooking({ id, slot })",
      "engine.createHold({ id, slot, expiresAt })",
      "engine.confirmHeldBooking({ holdId, bookingId })",
      "engine.addBooking(booking)",
      "engine.addHold(hold)"
    ]
  },
  {
    title: "Server-side confirmation",
    items: [
      "confirmBookingWithVersion({ ...config, repository, expectedVersion, bookingId, slot })",
      "confirmBookingWithVersionUsingEngine({ engine, repository, expectedVersion, bookingId, slot })",
      "confirmBookingWithRetry({ ...config, repository, bookingId, slot, maxVersionRetries? })",
      "createInMemoryRepository({ bookings?, holds?, initialVersion? })"
    ]
  }
] as const;

export const reactApiGroups = [
  {
    title: "Hooks",
    items: [
      "useBooking(config)",
      "useBookingConfirmation({ createHold?, confirmBooking?, confirmHeldBooking? })"
    ]
  },
  {
    title: "Starter components",
    items: [
      "BookingCalendar",
      "ServiceSelector",
      "TimeSlots",
      "BookingForm",
      "BookingSummary"
    ]
  },
  {
    title: "Responsibilities",
    items: [
      "Local service/date/slot selection state",
      "Slot display and booking form composition",
      "Hold and confirmation request orchestration",
      "No scheduling rules outside @openbooking/core"
    ]
  }
] as const;
