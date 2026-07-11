import type { LocalDate } from "@openbooking/core";

export interface BookingCalendarProps {
  selectedDate: LocalDate;
  onSelectDate: (date: LocalDate) => void;
}

export function BookingCalendar({ selectedDate, onSelectDate }: BookingCalendarProps) {
  return (
    <label className="ob-field">
      <span>Date</span>
      <input
        type="date"
        value={selectedDate}
        onChange={(event) => onSelectDate(event.currentTarget.value as LocalDate)}
      />
    </label>
  );
}
