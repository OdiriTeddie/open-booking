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

  return (
    <main className="demo-shell">
      <section className="demo-intro">
        <p className="eyebrow">Open Booking</p>
        <h1>Small studio booking flow</h1>
        <p>
          A headless scheduling engine with React adapters. Service duration,
          availability, buffers, bookings, and blackout dates are all resolved by
          <code>@openbooking/core</code>.
        </p>
      </section>

      <section className="booking-grid" aria-label="Booking demo">
        <div className="booking-panel">
          <h2>1. Service</h2>
          <ServiceSelector
            services={booking.services}
            selectedServiceId={booking.selectedServiceId}
            onSelectService={booking.selectService}
          />
        </div>

        <div className="booking-panel">
          <h2>2. Date</h2>
          <BookingCalendar
            selectedDate={booking.selectedDate}
            onSelectDate={booking.selectDate}
          />
        </div>

        <div className="booking-panel booking-panel-wide">
          <h2>3. Time</h2>
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
          <h2>4. Details</h2>
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
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
