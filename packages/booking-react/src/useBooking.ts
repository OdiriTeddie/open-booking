import {
  type BookingEngineConfig,
  type BookingSlot,
  createBookingEngine,
  type DiagnosedBookingSlot,
  type LocalDate
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
        dateOverrides: input.dateOverrides,
        recurringAvailability: input.recurringAvailability,
        recurringBlackoutRules: input.recurringBlackoutRules,
        bookingRules: input.bookingRules,
        minimumNoticeMinutes: input.minimumNoticeMinutes,
        maxAdvanceDays: input.maxAdvanceDays,
        now: input.now,
        slotIntervalMinutes: input.slotIntervalMinutes,
        timeZone: input.timeZone
      }),
    [
      input.availability,
      input.blackoutDates,
      input.bookings,
      input.bufferMinutes,
      input.dateOverrides,
      input.recurringAvailability,
      input.recurringBlackoutRules,
      input.bookingRules,
      input.minimumNoticeMinutes,
      input.maxAdvanceDays,
      input.now,
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

  const slotsWithAvailability = useMemo(() => {
    if (!selectedServiceId) {
      return [] as DiagnosedBookingSlot[];
    }

    return engine.getSlotsWithAvailability({
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
    slotsWithAvailability,
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

function todayUtcDate(): LocalDate {
  return new Date().toISOString().slice(0, 10) as LocalDate;
}
