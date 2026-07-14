import type { BookingSlot, BookingUnavailabilityReason, DiagnosedBookingSlot } from "@openbooking/core";
import { formatTime } from "../format";

export interface TimeSlotsProps {
  slots: readonly BookingSlot[];
  diagnosedSlots?: readonly DiagnosedBookingSlot[];
  selectedSlot?: BookingSlot | null;
  onSelectSlot: (slot: BookingSlot) => void;
}

export function TimeSlots({
  slots,
  diagnosedSlots,
  selectedSlot,
  onSelectSlot
}: TimeSlotsProps) {
  const renderedSlots =
    diagnosedSlots ?? slots.map((slot) => ({ ...slot, available: true as const, reason: undefined }));

  return (
    <div className="ob-time-slots">
      {renderedSlots.length === 0 ? <p className="ob-empty">No available times.</p> : null}
      {renderedSlots.map((slot) => (
        <button
          className="ob-button"
          data-available={slot.available}
          data-selected={slot.start === selectedSlot?.start}
          key={slot.start}
          disabled={!slot.available}
          onClick={() => onSelectSlot(slot)}
          title={slot.reason ? formatUnavailabilityReason(slot.reason) : undefined}
          type="button"
        >
          <span>{formatTime(slot.start)}</span>
          {!slot.available && slot.reason ? (
            <small>{formatUnavailabilityReason(slot.reason)}</small>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function formatUnavailabilityReason(reason: BookingUnavailabilityReason): string {
  switch (reason) {
    case "unknown-service":
      return "Unknown service";
    case "invalid-slot-duration":
      return "Duration mismatch";
    case "outside-availability":
      return "Outside business hours";
    case "blackout-date":
      return "Unavailable date";
    case "conflict":
      return "Already booked";
    case "minimum-notice":
      return "Too soon to book";
    case "max-advance":
      return "Too far in advance";
    case "max-bookings-per-day":
      return "Daily booking limit reached";
    case "max-bookings-per-service-per-day":
      return "Service daily limit reached";
  }
}
