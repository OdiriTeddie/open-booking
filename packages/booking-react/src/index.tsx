import {
  type BookingEngineConfig,
  type BookingSlot,
  createBookingEngine,
  type LocalDate,
  type Service
} from "@openbooking/core";
import { useMemo, useState } from "react";

export interface UseBookingInput extends BookingEngineConfig {
  initialServiceId?: string;
  initialDate?: LocalDate;
}

export function useBooking(input: UseBookingInput) {
  const [selectedServiceId, setSelectedServiceId] = useState(
    input.initialServiceId ?? input.services[0]?.id ?? ""
  );
  const [selectedDate, setSelectedDate] = useState<LocalDate>(
    input.initialDate ?? todayUtcDate()
  );
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);

  const engine = useMemo(
    () =>
      createBookingEngine({
        services: input.services,
        availability: input.availability,
        bookings: input.bookings,
        bufferMinutes: input.bufferMinutes,
        blackoutDates: input.blackoutDates,
        slotIntervalMinutes: input.slotIntervalMinutes,
        timeZone: input.timeZone
      }),
    [
      input.availability,
      input.blackoutDates,
      input.bookings,
      input.bufferMinutes,
      input.services,
      input.slotIntervalMinutes,
      input.timeZone
    ]
  );

  const slots = useMemo(() => {
    if (!selectedServiceId) {
      return [];
    }

    return engine.getAvailableSlots({
      serviceId: selectedServiceId,
      date: selectedDate
    });
  }, [engine, selectedDate, selectedServiceId]);

  return {
    engine,
    services: input.services,
    selectedServiceId,
    selectedDate,
    selectedSlot,
    slots,
    selectService: (serviceId: string) => {
      setSelectedServiceId(serviceId);
      setSelectedSlot(null);
    },
    selectDate: (date: LocalDate) => {
      setSelectedDate(date);
      setSelectedSlot(null);
    },
    selectSlot: setSelectedSlot
  };
}

export interface ServiceSelectorProps {
  services: readonly Service[];
  selectedServiceId?: string;
  onSelectService: (serviceId: string) => void;
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onSelectService
}: ServiceSelectorProps) {
  return (
    <div className="ob-service-selector">
      {services.map((service) => (
        <button
          className="ob-button"
          data-selected={service.id === selectedServiceId}
          key={service.id}
          onClick={() => onSelectService(service.id)}
          type="button"
        >
          <span>{service.name}</span>
          <small>{service.durationMinutes} min</small>
        </button>
      ))}
    </div>
  );
}

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

export interface TimeSlotsProps {
  slots: BookingSlot[];
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

export interface BookingFormValues {
  name: string;
  email: string;
  notes: string;
}

export interface BookingFormProps {
  disabled?: boolean;
  onSubmit: (values: BookingFormValues) => void;
}

export function BookingForm({ disabled, onSubmit }: BookingFormProps) {
  const [values, setValues] = useState<BookingFormValues>({
    name: "",
    email: "",
    notes: ""
  });

  return (
    <form
      className="ob-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <label className="ob-field">
        <span>Name</span>
        <input
          required
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.currentTarget.value })}
        />
      </label>
      <label className="ob-field">
        <span>Email</span>
        <input
          required
          type="email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.currentTarget.value })}
        />
      </label>
      <label className="ob-field">
        <span>Notes</span>
        <textarea
          value={values.notes}
          onChange={(event) => setValues({ ...values, notes: event.currentTarget.value })}
        />
      </label>
      <button className="ob-submit" disabled={disabled} type="submit">
        Request booking
      </button>
    </form>
  );
}

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

function todayUtcDate(): LocalDate {
  return new Date().toISOString().slice(0, 10) as LocalDate;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(value));
}
