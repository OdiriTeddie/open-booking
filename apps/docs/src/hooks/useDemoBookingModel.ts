import { createBookingEngine } from "@openbooking/core";
import { useMemo, useState } from "react";
import { useBooking, useBookingConfirmation } from "@openbooking/react";
import { availability, bookings, diagnosticDates, services } from "../data";

export function useDemoBookingModel() {
  const [message, setMessage] = useState("");
  const booking = useBooking({
    services,
    availability,
    bookings,
    bufferMinutes: 15,
    bookingRules: {
      maxBookingsPerDay: 3
    },
    blackoutDates: ["2026-08-01"],
    minimumNoticeMinutes: 120,
    now: "2026-07-18T08:15:00.000Z",
    slotIntervalMinutes: 30,
    initialDate: diagnosticDates.mixed
  });

  const engine = useMemo(
    () =>
      createBookingEngine({
        services,
        availability,
        bookings,
        bufferMinutes: 15,
        bookingRules: {
          maxBookingsPerDay: 3
        },
        blackoutDates: ["2026-08-01"],
        minimumNoticeMinutes: 120,
        now: "2026-07-18T08:15:00.000Z",
        slotIntervalMinutes: 30
      }),
    []
  );

  const confirmation = useBookingConfirmation({
    async createHold(input) {
      return {
        status: "held" as const,
        resource: {
          id: input.id,
          slot: input.slot,
          expiresAt: input.expiresAt
        },
        engine
      };
    },
    async confirmHeldBooking(input) {
      return {
        status: "confirmed" as const,
        resource: {
          id: input.bookingId,
          serviceId: booking.selectedSlot?.serviceId ?? "consultation",
          start: booking.selectedSlot?.start ?? "2026-07-18T10:00:00.000Z",
          end: booking.selectedSlot?.end ?? "2026-07-18T10:30:00.000Z"
        },
        engine
      };
    }
  });

  const selectedService = useMemo(
    () => services.find((service) => service.id === booking.selectedServiceId),
    [booking.selectedServiceId]
  );
  const availabilityForDate = engine.getAvailabilityForDate(booking.selectedDate);
  const unavailableSlots = booking.slotsWithAvailability.filter((slot) => !slot.available);
  const blockedReasonCounts = unavailableSlots.reduce<Record<string, number>>((accumulator, slot) => {
    const reason = slot.reason ?? "unknown";
    accumulator[reason] = (accumulator[reason] ?? 0) + 1;
    return accumulator;
  }, {});

  const snippets = {
    liveCore: `import { createBookingEngine } from "@openbooking/core";

const engine = createBookingEngine({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  bookingRules: { maxBookingsPerDay: 3 },
  blackoutDates: ["2026-08-01"],
  minimumNoticeMinutes: 120,
  now: "2026-07-18T08:15:00.000Z"
});

const slotAvailability = engine.getSlotsWithAvailability({
  serviceId: "${booking.selectedServiceId}",
  date: "${booking.selectedDate}"
});`,
    liveReact: `const booking = useBooking({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  bookingRules: { maxBookingsPerDay: 3 },
  blackoutDates: ["2026-08-01"],
  minimumNoticeMinutes: 120,
  now: "2026-07-18T08:15:00.000Z",
  initialDate: "${booking.selectedDate}"
});`,
    reactApi: `const confirmation = useBookingConfirmation({
  createHold: (input) => api.createHold(input),
  confirmHeldBooking: (input) => api.confirmHeldBooking(input)
});`,
    serverFlow: `import { confirmBookingWithRetry } from "@openbooking/core";

const confirmation = await confirmBookingWithRetry({
  services,
  availability,
  repository,
  bookingId: "booking-42",
  holdId: "hold-42",
  slot,
  now: "2026-07-18T12:05:00.000Z",
  maxVersionRetries: 1
});`
  };

  async function submitBooking(name: string): Promise<void> {
    if (!booking.selectedSlot) {
      return;
    }

    const holdResult = await confirmation.requestHold({
      id: "hold-demo",
      slot: booking.selectedSlot,
      expiresAt: "2026-07-18T12:10:00.000Z"
    });

    if (holdResult.status === "unavailable") {
      setMessage(`Hold failed: ${holdResult.reason}.`);
      return;
    }

    if (holdResult.status === "duplicate") {
      setMessage("Hold already exists for the selected slot.");
      return;
    }

    const confirmResult = await confirmation.confirmHeldSlot({
      holdId: holdResult.resource.id,
      bookingId: "booking-demo"
    });

    if (confirmResult.status === "confirmed") {
      setMessage(`Booking request received for ${name} at ${confirmResult.resource.start}.`);
      return;
    }

    if (confirmResult.status === "duplicate") {
      setMessage("Booking already exists for this hold.");
      return;
    }

    setMessage(`Confirmation failed: ${confirmResult.reason}.`);
  }

  return {
    booking,
    selectedService,
    availabilityForDate,
    unavailableSlots,
    blockedReasonCounts,
    message,
    snippets,
    submitBooking
  };
}
