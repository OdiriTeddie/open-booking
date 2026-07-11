import type { BookingSlot, Service } from "@openbooking/core";
import { formatDate, formatTime } from "../format";

export interface BookingSummaryProps {
  service?: Service;
  slot?: BookingSlot | null;
}

export function BookingSummary({ service, slot }: BookingSummaryProps) {
  return (
    <div className="ob-summary">
      <h3>Summary</h3>
      <p>{service ? service.name : "Choose a service"}</p>
      <p>{slot ? `${formatDate(slot.start)} at ${formatTime(slot.start)}` : "Choose a time"}</p>
    </div>
  );
}
