export function buildApiReferenceCoreSnippet(input: {
  blackoutDate: string;
  browseNow: string;
  confirmNow: string;
  capacityDate: string;
}): string {
  return `import {
  createBookingEngine,
  confirmBookingWithRetry
} from "@openbooking/core";

const engine = createBookingEngine({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  blackoutDates: ["${input.blackoutDate}"],
  minimumNoticeMinutes: 120,
  now: "${input.browseNow}"
});

const slots = engine.getSlotsWithAvailability({
  serviceId: "consultation",
  date: "${input.capacityDate}"
});

const confirmation = await confirmBookingWithRetry({
  services,
  availability,
  repository,
  bookingId: "booking-42",
  holdId: "hold-42",
  slot: slots[0],
  now: "${input.confirmNow}"
});`;
}

export function buildApiReferenceReactSnippet(initialDate: string): string {
  return `import {
  useBooking,
  useBookingConfirmation
} from "@openbooking/react";

const booking = useBooking({
  services,
  availability,
  bookings,
  initialDate: "${initialDate}"
});

const confirmation = useBookingConfirmation({
  createHold: (input) => api.createHold(input),
  confirmHeldBooking: (input) => api.confirmHeldBooking(input)
});`;
}
