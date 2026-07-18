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
