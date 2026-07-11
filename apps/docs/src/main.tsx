import { createBookingEngine } from "@openbooking/core";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookingCalendar,
  BookingForm,
  BookingSummary,
  ServiceSelector,
  TimeSlots,
  useBooking
} from "@openbooking/react";
import "@openbooking/ui/styles.css";
import "./styles.css";

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
  }
];

function App() {
  const [message, setMessage] = useState("");
  const booking = useBooking({
    services,
    availability,
    bookings,
    bufferMinutes: 15,
    blackoutDates: ["2026-07-25"],
    slotIntervalMinutes: 30,
    initialDate: "2026-07-10"
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
        blackoutDates: ["2026-07-25"],
        slotIntervalMinutes: 30
      }),
    []
  );
  const availabilityForDate = engine.getAvailabilityForDate(booking.selectedDate);
  const liveCoreSnippet = `import { createBookingEngine } from "@openbooking/core";

const engine = createBookingEngine({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  blackoutDates: ["2026-07-25"]
});

const slots = engine.getAvailableSlots({
  serviceId: "${booking.selectedServiceId}",
  date: "${booking.selectedDate}"
});`;
  const liveReactSnippet = `const booking = useBooking({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  blackoutDates: ["2026-07-25"],
  initialDate: "${booking.selectedDate}"
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
              <p>Live API</p>
              <h2>Core output for the current demo state</h2>
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
                  onSubmit={(values) => {
                    setMessage(
                      `Booking request received for ${values.name} at ${booking.selectedSlot?.start}.`
                    );
                  }}
                />
                {message ? <p className="demo-message">{message}</p> : null}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
