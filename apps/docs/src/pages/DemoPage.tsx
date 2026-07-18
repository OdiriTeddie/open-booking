import {
  BookingCalendar,
  BookingForm,
  BookingSummary,
  ServiceSelector,
  TimeSlots
} from "@openbooking/react";
import { CodePanel } from "../components/CodePanel";
import { ComparisonCard } from "../components/ComparisonCard";
import { InspectorCard } from "../components/InspectorCard";
import { SectionHeading } from "../components/SectionHeading";
import { diagnosticDates } from "../data";
import { formatReasonLabel } from "../formatters";
import { useDemoBookingModel } from "../hooks/useDemoBookingModel";

export function DemoPage() {
  const {
    booking,
    selectedService,
    availabilityForDate,
    unavailableSlots,
    blockedReasonCounts,
    message,
    snippets,
    submitBooking
  } = useDemoBookingModel();

  return (
    <section className="content-grid">
      <section className="docs-stack">
        <div className="docs-panel">
          <SectionHeading eyebrow="Packages" title="Core and React, side by side" />
          <div className="comparison-grid">
            <ComparisonCard title="@openbooking/core">
              Pure TypeScript engine for services, weekly availability, blackout dates,
              conflicts, buffers, and slot generation.
            </ComparisonCard>
            <ComparisonCard title="@openbooking/react">
              Hooks and starter components that wrap the core engine without moving
              scheduling rules into the UI layer.
            </ComparisonCard>
          </div>
        </div>

        <div className="docs-panel">
          <SectionHeading eyebrow="Diagnostics" title="Preset dates that expose blocked states" />
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
            <InspectorCard label="Weekday" value={availabilityForDate.weekday} />
            <InspectorCard
              label="Windows"
              value={availabilityForDate.windows.map((window) => `${window.start}-${window.end}`).join(", ")}
            />
            <InspectorCard label="First slot" value={booking.slots[0]?.start ?? "No slot"} />
            <InspectorCard
              label="First blocked reason"
              value={unavailableSlots[0]?.reason ?? "None"}
            />
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
            <CodePanel title="Core usage">{snippets.liveCore}</CodePanel>
            <CodePanel title="React usage">{snippets.liveReact}</CodePanel>
          </div>
        </div>

        <div className="docs-panel">
          <SectionHeading eyebrow="API flow" title="React client, core-backed server confirm" />
          <div className="comparison-grid">
            <div className="comparison-card">
              <h3>Client</h3>
              <p>
                Use <code>useBookingConfirmation</code> to request holds and confirm
                bookings against your own backend endpoints.
              </p>
              <pre>{snippets.reactApi}</pre>
            </div>
            <div className="comparison-card">
              <h3>Server</h3>
              <p>
                Use <code>confirmBookingWithRetry</code> on the server for final
                validation, version-safe confirmation, and one bounded retry.
              </p>
              <pre>{snippets.serverFlow}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="demo-pane" aria-label="Booking demo">
        <div className="docs-panel">
          <SectionHeading eyebrow="Demo flow" title="Small studio booking" />
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
                onSubmit={(values) => submitBooking(values.name)}
              />
              {message ? <p className="demo-message">{message}</p> : null}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
