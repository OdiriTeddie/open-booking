import { createBookingEngine } from "@openbooking/core";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookingCalendar,
  BookingForm,
  BookingSummary,
  ServiceSelector,
  TimeSlots,
  useBooking,
  useBookingConfirmation
} from "@openbooking/react";
import "@openbooking/ui/styles.css";
import "./styles.css";

const diagnosticDates = {
  mixed: "2026-07-10",
  capacity: "2026-07-11",
  blackout: "2026-07-25"
} as const;

const services = [
  { id: "consultation", name: "Consultation", durationMinutes: 30 },
  { id: "portrait-session", name: "Portrait Session", durationMinutes: 60 },
  { id: "brand-shoot", name: "Brand Shoot", durationMinutes: 90 }
];

const availability = {
  monday: [{ start: "09:00", end: "17:00" }],
  tuesday: [{ start: "09:00", end: "17:00" }],
  wednesday: [{ start: "11:00", end: "18:00" }],
  friday: [{ start: "09:00", end: "15:00" }],
  saturday: [{ start: "10:00", end: "14:00" }]
} as const;

const bookings = [
  {
    id: "booking-1",
    serviceId: "portrait-session",
    start: "2026-07-10T10:00:00.000Z",
    end: "2026-07-10T11:00:00.000Z"
  },
  {
    id: "booking-2",
    serviceId: "consultation",
    start: "2026-07-11T11:30:00.000Z",
    end: "2026-07-11T12:00:00.000Z"
  },
  {
    id: "booking-3",
    serviceId: "brand-shoot",
    start: "2026-07-11T10:00:00.000Z",
    end: "2026-07-11T11:30:00.000Z"
  },
  {
    id: "booking-4",
    serviceId: "portrait-session",
    start: "2026-07-11T12:00:00.000Z",
    end: "2026-07-11T13:00:00.000Z"
  }
];

const integrationGuides = [
  {
    id: "nextjs",
    label: "Next.js",
    title: "Next.js route handler",
    description:
      "Use a route handler or server action to confirm the held slot against the latest repository snapshot.",
    snippet: `import { NextResponse } from "next/server";
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
    now: "2026-07-18T12:05:00.000Z",
    maxVersionRetries: 1
  });

  if (confirmation.status === "confirmed") {
    return NextResponse.json(confirmation.resource, { status: 201 });
  }

  return NextResponse.json(confirmation, { status: 409 });
}`
  },
  {
    id: "express",
    label: "Express",
    title: "Express POST handler",
    description:
      "Keep hold creation and final confirmation in API handlers while React calls them through useBookingConfirmation.",
    snippet: `import express from "express";
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
    now: "2026-07-18T12:05:00.000Z",
    maxVersionRetries: 1
  });

  if (confirmation.status === "confirmed") {
    return res.status(201).json(confirmation.resource);
  }

  return res.status(409).json(confirmation);
});`
  },
  {
    id: "fastify",
    label: "Fastify",
    title: "Fastify route",
    description:
      "Use the same core helper inside a typed Fastify route to keep concurrency handling consistent across adapters.",
    snippet: `import Fastify from "fastify";
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
    now: "2026-07-18T12:05:00.000Z",
    maxVersionRetries: 1
  });

  if (confirmation.status === "confirmed") {
    return reply.code(201).send(confirmation.resource);
  }

  return reply.code(409).send(confirmation);
});`
  }
] as const;

function App() {
  const [message, setMessage] = useState("");
  const [selectedGuideId, setSelectedGuideId] = useState<(typeof integrationGuides)[number]["id"]>(
    "nextjs"
  );
  const booking = useBooking({
    services,
    availability,
    bookings,
    bufferMinutes: 15,
    bookingRules: {
      maxBookingsPerDay: 3
    },
    blackoutDates: ["2026-07-25"],
    minimumNoticeMinutes: 120,
    now: "2026-07-10T08:15:00.000Z",
    slotIntervalMinutes: 30,
    initialDate: diagnosticDates.mixed
  });
  const confirmation = useBookingConfirmation({
    async createHold(input) {
      return {
        status: "held",
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
        status: "confirmed",
        resource: {
          id: input.bookingId,
          serviceId: booking.selectedSlot?.serviceId ?? "consultation",
          start: booking.selectedSlot?.start ?? "2026-07-24T09:00:00.000Z",
          end: booking.selectedSlot?.end ?? "2026-07-24T09:30:00.000Z"
        },
        engine
      };
    }
  });

  const selectedService = useMemo(
    () => services.find((service) => service.id === booking.selectedServiceId),
    [booking.selectedServiceId]
  );
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
        blackoutDates: ["2026-07-25"],
        minimumNoticeMinutes: 120,
        now: "2026-07-10T08:15:00.000Z",
        slotIntervalMinutes: 30
      }),
    []
  );
  const availabilityForDate = engine.getAvailabilityForDate(booking.selectedDate);
  const unavailableSlots = booking.slotsWithAvailability.filter((slot) => !slot.available);
  const blockedReasonCounts = unavailableSlots.reduce<Record<string, number>>((accumulator, slot) => {
    const reason = slot.reason ?? "unknown";
    accumulator[reason] = (accumulator[reason] ?? 0) + 1;
    return accumulator;
  }, {});
  const selectedGuide =
    integrationGuides.find((guide) => guide.id === selectedGuideId) ?? integrationGuides[0];
  const liveCoreSnippet = `import { createBookingEngine } from "@openbooking/core";

const engine = createBookingEngine({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  bookingRules: { maxBookingsPerDay: 3 },
  blackoutDates: ["2026-07-25"],
  minimumNoticeMinutes: 120,
  now: "2026-07-10T08:15:00.000Z"
});

const slotAvailability = engine.getSlotsWithAvailability({
  serviceId: "${booking.selectedServiceId}",
  date: "${booking.selectedDate}"
});`;
  const liveReactSnippet = `const booking = useBooking({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  bookingRules: { maxBookingsPerDay: 3 },
  blackoutDates: ["2026-07-25"],
  minimumNoticeMinutes: 120,
  now: "2026-07-10T08:15:00.000Z",
  initialDate: "${booking.selectedDate}"
});`;
  const serverFlowSnippet = `import { confirmBookingWithRetry } from "@openbooking/core";

const confirmation = await confirmBookingWithRetry({
  services,
  availability,
  repository,
  bookingId: "booking-42",
  holdId: "hold-42",
  slot,
  now: "2026-07-18T12:05:00.000Z",
  maxVersionRetries: 1
});`;
  const reactApiSnippet = `const confirmation = useBookingConfirmation({
  createHold: (input) => api.createHold(input),
  confirmHeldBooking: (input) => api.confirmHeldBooking(input)
});`;

  return (
    <main className="demo-shell">
      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">Open Booking</p>
          <h1>Headless booking for service businesses</h1>
          <p className="hero-text">
            Pure scheduling logic in <code>@openbooking/core</code>, React primitives in
            <code>@openbooking/react</code>, and a small-business booking flow you can
            inspect live.
          </p>
          <div className="install-row">
            <code>pnpm add @openbooking/core</code>
            <code>pnpm add @openbooking/react react</code>
          </div>
        </div>

        <div className="hero-aside">
          <div className="metric">
            <span>Selected service</span>
            <strong>{selectedService?.name ?? "None"}</strong>
          </div>
          <div className="metric">
            <span>Available slots</span>
            <strong>{booking.slots.length}</strong>
          </div>
          <div className="metric">
            <span>Unavailable slots</span>
            <strong>{unavailableSlots.length}</strong>
          </div>
          <div className="metric">
            <span>Availability windows</span>
            <strong>{availabilityForDate.windows.length}</strong>
          </div>
          <div className="metric">
            <span>Blackout date</span>
            <strong>{availabilityForDate.isBlackoutDate ? "Yes" : "No"}</strong>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <section className="docs-stack">
          <div className="docs-panel">
            <div className="section-heading">
              <p>Packages</p>
              <h2>Core and React, side by side</h2>
            </div>
            <div className="comparison-grid">
              <article className="comparison-card">
                <h3>@openbooking/core</h3>
                <p>
                  Pure TypeScript engine for services, weekly availability, blackout
                  dates, conflicts, buffers, and slot generation.
                </p>
              </article>
              <article className="comparison-card">
                <h3>@openbooking/react</h3>
                <p>
                  Hooks and starter components that wrap the core engine without moving
                  scheduling rules into the UI layer.
                </p>
              </article>
            </div>
          </div>

          <div className="docs-panel">
            <div className="section-heading">
              <p>Diagnostics</p>
              <h2>Preset dates that expose blocked states</h2>
            </div>
            <div className="scenario-row">
              <button
                className="scenario-chip"
                data-selected={booking.selectedDate === diagnosticDates.mixed}
                onClick={() => booking.selectDate(diagnosticDates.mixed)}
                type="button"
              >
                July 10
                <small>Notice + conflicts</small>
              </button>
              <button
                className="scenario-chip"
                data-selected={booking.selectedDate === diagnosticDates.capacity}
                onClick={() => booking.selectDate(diagnosticDates.capacity)}
                type="button"
              >
                July 11
                <small>Daily cap reached</small>
              </button>
              <button
                className="scenario-chip"
                data-selected={booking.selectedDate === diagnosticDates.blackout}
                onClick={() => booking.selectDate(diagnosticDates.blackout)}
                type="button"
              >
                July 25
                <small>Blackout date</small>
              </button>
            </div>
            <div className="inspector-grid">
              <div className="inspector-card">
                <span>Weekday</span>
                <strong>{availabilityForDate.weekday}</strong>
              </div>
              <div className="inspector-card">
                <span>Windows</span>
                <strong>
                  {availabilityForDate.windows.map((window) => `${window.start}-${window.end}`).join(", ")}
                </strong>
              </div>
              <div className="inspector-card">
                <span>First slot</span>
                <strong>{booking.slots[0]?.start ?? "No slot"}</strong>
              </div>
              <div className="inspector-card">
                <span>First blocked reason</span>
                <strong>{unavailableSlots[0]?.reason ?? "None"}</strong>
              </div>
            </div>
            <div className="reason-list" aria-label="Blocked slot reasons">
              {Object.entries(blockedReasonCounts).length === 0 ? (
                <p className="reason-empty">
                  {availabilityForDate.isBlackoutDate
                    ? "This date is fully blocked by a blackout rule."
                    : "No blocked slot reasons for the current date."}
                </p>
              ) : (
                Object.entries(blockedReasonCounts).map(([reason, count]) => (
                  <div className="reason-row" key={reason}>
                    <span>{formatReasonLabel(reason)}</span>
                    <strong>{count}</strong>
                  </div>
                ))
              )}
            </div>
            <div className="code-grid">
              <article className="code-panel">
                <h3>Core usage</h3>
                <pre>{liveCoreSnippet}</pre>
              </article>
              <article className="code-panel">
                <h3>React usage</h3>
                <pre>{liveReactSnippet}</pre>
              </article>
            </div>
          </div>

          <div className="docs-panel">
            <div className="section-heading">
              <p>API flow</p>
              <h2>React client, core-backed server confirm</h2>
            </div>
            <div className="comparison-grid">
              <article className="comparison-card">
                <h3>Client</h3>
                <p>
                  Use <code>useBookingConfirmation</code> to request holds and confirm
                  bookings against your own backend endpoints.
                </p>
                <pre>{reactApiSnippet}</pre>
              </article>
              <article className="comparison-card">
                <h3>Server</h3>
                <p>
                  Use <code>confirmBookingWithRetry</code> on the server for final
                  validation, version-safe confirmation, and one bounded retry.
                </p>
                <pre>{serverFlowSnippet}</pre>
              </article>
            </div>
          </div>
        </section>

        <section className="demo-pane" aria-label="Booking demo">
          <div className="docs-panel">
            <div className="section-heading">
              <p>Demo flow</p>
              <h2>Small studio booking</h2>
            </div>
            <div className="booking-grid">
              <div className="booking-panel">
                <h3>1. Service</h3>
                <ServiceSelector
                  services={booking.services}
                  selectedServiceId={booking.selectedServiceId}
                  onSelectService={booking.selectService}
                />
              </div>

              <div className="booking-panel">
                <h3>2. Date</h3>
                <BookingCalendar
                  selectedDate={booking.selectedDate}
                  onSelectDate={booking.selectDate}
                />
              </div>

              <div className="booking-panel booking-panel-wide">
                <h3>3. Time</h3>
                <TimeSlots
                  slots={booking.slots}
                  diagnosedSlots={booking.slotsWithAvailability}
                  selectedSlot={booking.selectedSlot}
                  onSelectSlot={booking.selectSlot}
                />
              </div>

              <div className="booking-panel">
                <BookingSummary service={selectedService} slot={booking.selectedSlot} />
              </div>

              <div className="booking-panel">
                <h3>4. Details</h3>
                <BookingForm
                  disabled={!booking.selectedSlot}
                  onSubmit={async (values) => {
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
                      setMessage(
                        `Booking request received for ${values.name} at ${confirmResult.resource.start}.`
                      );
                      return;
                    }

                    if (confirmResult.status === "duplicate") {
                      setMessage("Booking already exists for this hold.");
                      return;
                    }

                    setMessage(`Confirmation failed: ${confirmResult.reason}.`);
                  }}
                />
                {message ? <p className="demo-message">{message}</p> : null}
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="integration-guide" aria-label="Integration guide">
        <div className="docs-panel">
          <div className="section-heading">
            <p>Integration guide</p>
            <h2>Framework-specific server confirmation examples</h2>
          </div>
          <p className="guide-intro">
            The client keeps using <code>useBookingConfirmation</code>. The server owns
            hold persistence, final validation, and optimistic concurrency through
            <code>confirmBookingWithRetry</code>.
          </p>
          <div className="guide-tabs" role="tablist" aria-label="Framework examples">
            {integrationGuides.map((guide) => (
              <button
                aria-selected={guide.id === selectedGuide.id}
                className="guide-tab"
                data-selected={guide.id === selectedGuide.id}
                key={guide.id}
                onClick={() => setSelectedGuideId(guide.id)}
                role="tab"
                type="button"
              >
                {guide.label}
              </button>
            ))}
          </div>
          <div className="guide-layout">
            <div className="guide-copy">
              <div className="guide-card">
                <span>Framework</span>
                <strong>{selectedGuide.title}</strong>
              </div>
              <div className="guide-card">
                <span>Pattern</span>
                <strong>Hold on client, confirm on server</strong>
              </div>
              <div className="guide-card guide-card-wide">
                <span>Notes</span>
                <strong>{selectedGuide.description}</strong>
              </div>
            </div>
            <article className="code-panel">
              <h3>{selectedGuide.title}</h3>
              <pre>{selectedGuide.snippet}</pre>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

function formatReasonLabel(reason: string): string {
  switch (reason) {
    case "minimum-notice":
      return "Minimum notice";
    case "conflict":
      return "Existing conflict";
    case "max-bookings-per-day":
      return "Daily booking cap";
    case "blackout-date":
      return "Blackout date";
    case "outside-availability":
      return "Outside business hours";
    case "max-advance":
      return "Advance window";
    case "max-bookings-per-service-per-day":
      return "Service booking cap";
    case "invalid-slot-duration":
      return "Duration mismatch";
    case "unknown-service":
      return "Unknown service";
    default:
      return reason;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
