export function buildNextJsConfirmSnippet(confirmNow: string): string {
  return `import { NextResponse } from "next/server";
import { confirmBookingWithRetry } from "@openbooking/core";

export async function POST(request: Request) {
  const input = await request.json();

  const confirmation = await confirmBookingWithRetry({
    services,
    availability,
    repository,
    bookingId: input.bookingId,
    holdId: input.holdId,
    slot: input.slot,
    now: "${confirmNow}",
    maxVersionRetries: 1
  });

  if (confirmation.status === "confirmed") {
    return NextResponse.json(confirmation.resource, { status: 201 });
  }

  return NextResponse.json(confirmation, { status: 409 });
}`;
}

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

export function buildExpressConfirmSnippet(confirmNow: string): string {
  return `import express from "express";
import { confirmBookingWithRetry } from "@openbooking/core";

const app = express();

app.post("/api/booking/confirm", async (req, res) => {
  const confirmation = await confirmBookingWithRetry({
    services,
    availability,
    repository,
    bookingId: req.body.bookingId,
    holdId: req.body.holdId,
    slot: req.body.slot,
    now: "${confirmNow}",
    maxVersionRetries: 1
  });

  if (confirmation.status === "confirmed") {
    return res.status(201).json(confirmation.resource);
  }

  return res.status(409).json(confirmation);
});`;
}

export function buildFastifyConfirmSnippet(confirmNow: string): string {
  return `import Fastify from "fastify";
import { confirmBookingWithRetry } from "@openbooking/core";

const app = Fastify();

app.post("/api/booking/confirm", async (request, reply) => {
  const input = request.body as {
    bookingId: string;
    holdId?: string;
    slot: {
      serviceId: string;
      start: string;
      end: string;
    };
  };

  const confirmation = await confirmBookingWithRetry({
    services,
    availability,
    repository,
    bookingId: input.bookingId,
    holdId: input.holdId,
    slot: input.slot,
    now: "${confirmNow}",
    maxVersionRetries: 1
  });

  if (confirmation.status === "confirmed") {
    return reply.code(201).send(confirmation.resource);
  }

  return reply.code(409).send(confirmation);
});`;
}
