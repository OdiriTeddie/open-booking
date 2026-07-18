export function buildCoreAvailabilitySnippet(input: {
  blackoutDate: string;
  browseNow: string;
  serviceId: string;
  date: string;
}): string {
  return `import { createBookingEngine } from "@openbooking/core";

const engine = createBookingEngine({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  bookingRules: { maxBookingsPerDay: 3 },
  blackoutDates: ["${input.blackoutDate}"],
  minimumNoticeMinutes: 120,
  now: "${input.browseNow}"
});

const slotAvailability = engine.getSlotsWithAvailability({
  serviceId: "${input.serviceId}",
  date: "${input.date}"
});`;
}

export function buildReactBookingSnippet(input: {
  blackoutDate: string;
  browseNow: string;
  initialDate: string;
}): string {
  return `const booking = useBooking({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  bookingRules: { maxBookingsPerDay: 3 },
  blackoutDates: ["${input.blackoutDate}"],
  minimumNoticeMinutes: 120,
  now: "${input.browseNow}",
  initialDate: "${input.initialDate}"
});`;
}

export function buildReactConfirmationSnippet(): string {
  return `const confirmation = useBookingConfirmation({
  createHold: (input) => api.createHold(input),
  confirmHeldBooking: (input) => api.confirmHeldBooking(input)
});`;
}

export function buildServerFlowSnippet(confirmNow: string): string {
  return `import { confirmBookingWithRetry } from "@openbooking/core";

const confirmation = await confirmBookingWithRetry({
  services,
  availability,
  repository,
  bookingId: "booking-42",
  holdId: "hold-42",
  slot,
  now: "${confirmNow}",
  maxVersionRetries: 1
});`;
}
