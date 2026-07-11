import type { BookingSlot } from "@openbooking/core";
import { formatTime } from "../format";

export interface TimeSlotsProps {
  slots: readonly BookingSlot[];
  selectedSlot?: BookingSlot | null;
  onSelectSlot: (slot: BookingSlot) => void;
}

export function TimeSlots({ slots, selectedSlot, onSelectSlot }: TimeSlotsProps) {
  return (
    <div className="ob-time-slots">
      {slots.length === 0 ? <p className="ob-empty">No available times.</p> : null}
      {slots.map((slot) => (
        <button
          className="ob-button"
          data-selected={slot.start === selectedSlot?.start}
          key={slot.start}
          onClick={() => onSelectSlot(slot)}
          type="button"
        >
          {formatTime(slot.start)}
        </button>
      ))}
    </div>
  );
}
