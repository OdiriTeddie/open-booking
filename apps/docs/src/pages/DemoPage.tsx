import { createBookingEngine } from "@openbooking/core";
import { useMemo, useState } from "react";
import {
  BookingCalendar,
  BookingForm,
  BookingSummary,
  ServiceSelector,
  TimeSlots,
  useBooking,
  useBookingConfirmation
} from "@openbooking/react";
import { availability, bookings, diagnosticDates, services } from "../data";
import { formatReasonLabel } from "../formatters";

export function DemoPage() {
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
  const liveCoreSnippet = `import { createBookingEngine } from "@openbooking/core";

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
});`;
  const liveReactSnippet = `const booking = useBooking({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  bookingRules: { maxBookingsPerDay: 3 },
  blackoutDates: ["2026-08-01"],
  minimumNoticeMinutes: 120,
  now: "2026-07-18T08:15:00.000Z",
  initialDate: "${booking.selectedDate}"
});`;
  const reactApiSnippet = `const confirmation = useBookingConfirmation({
  createHold: (input) => api.createHold(input),
  confirmHeldBooking: (input) => api.confirmHeldBooking(input)
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

  return (
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
                Pure TypeScript engine for services, weekly availability, blackout dates,
                conflicts, buffers, and slot generation.
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
              July 18
              <small>Notice + conflicts</small>
            </button>
            <button
              className="scenario-chip"
              data-selected={booking.selectedDate === diagnosticDates.capacity}
              onClick={() => booking.selectDate(diagnosticDates.capacity)}
              type="button"
            >
              July 25
              <small>Daily cap reached</small>
            </button>
            <button
              className="scenario-chip"
              data-selected={booking.selectedDate === diagnosticDates.blackout}
              onClick={() => booking.selectDate(diagnosticDates.blackout)}
              type="button"
            >
              Aug 1
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
  );
}
