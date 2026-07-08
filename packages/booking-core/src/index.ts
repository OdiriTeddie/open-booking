export type Weekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type LocalDate = `${number}-${number}-${number}`;
export type LocalTime = `${number}:${number}`;
export type IsoDateTime = string;

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
}

export interface AvailabilityWindow {
  start: LocalTime;
  end: LocalTime;
}

export type WeeklyAvailability = Partial<Record<Weekday, readonly AvailabilityWindow[]>>;

export interface Booking {
  id: string;
  serviceId: string;
  start: IsoDateTime;
  end: IsoDateTime;
}

export interface BookingSlot {
  serviceId: string;
  start: IsoDateTime;
  end: IsoDateTime;
}

export interface BookingEngineConfig {
  services: readonly Service[];
  availability: WeeklyAvailability;
  bookings?: readonly Booking[];
  bufferMinutes?: number;
  blackoutDates?: readonly LocalDate[];
  slotIntervalMinutes?: number;
  timeZone?: "utc";
}

export interface GetAvailableSlotsInput {
  serviceId: string;
  date: LocalDate;
}

export interface BookingEngine {
  getAvailableSlots(input: GetAvailableSlotsInput): BookingSlot[];
  hasConflict(slot: BookingSlot): boolean;
  getService(serviceId: string): Service | undefined;
}

const weekdays: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

export function createBookingEngine(config: BookingEngineConfig): BookingEngine {
  const services = new Map(config.services.map((service) => [service.id, service]));
  const bookings = config.bookings ?? [];
  const bufferMinutes = config.bufferMinutes ?? 0;
  const slotIntervalMinutes = config.slotIntervalMinutes ?? 15;
  const blackoutDates = new Set(config.blackoutDates ?? []);

  if (config.timeZone && config.timeZone !== "utc") {
    throw new Error("Only the 'utc' timezone mode is supported in the MVP.");
  }

  validateConfig(config);

  function getService(serviceId: string): Service | undefined {
    return services.get(serviceId);
  }

  function hasConflict(slot: BookingSlot): boolean {
    const slotStart = Date.parse(slot.start);
    const slotEnd = Date.parse(slot.end);

    return bookings.some((booking) => {
      const bookingStart = addMinutes(Date.parse(booking.start), -bufferMinutes);
      const bookingEnd = addMinutes(Date.parse(booking.end), bufferMinutes);

      return slotStart < bookingEnd && slotEnd > bookingStart;
    });
  }

  function getAvailableSlots(input: GetAvailableSlotsInput): BookingSlot[] {
    const service = services.get(input.serviceId);

    if (!service) {
      throw new Error(`Unknown service id: ${input.serviceId}`);
    }

    if (blackoutDates.has(input.date)) {
      return [];
    }

    const weekday = getWeekday(input.date);
    const windows = config.availability[weekday] ?? [];

    return windows.flatMap((window) =>
      generateSlotsForWindow(input.date, window, service, slotIntervalMinutes).filter(
        (slot) => !hasConflict(slot)
      )
    );
  }

  return {
    getAvailableSlots,
    hasConflict,
    getService
  };
}

function validateConfig(config: BookingEngineConfig): void {
  if (config.services.length === 0) {
    throw new Error("At least one service is required.");
  }

  for (const service of config.services) {
    if (service.durationMinutes <= 0) {
      throw new Error(`Service '${service.id}' must have a positive duration.`);
    }
  }

  if ((config.bufferMinutes ?? 0) < 0) {
    throw new Error("bufferMinutes cannot be negative.");
  }

  if ((config.slotIntervalMinutes ?? 15) <= 0) {
    throw new Error("slotIntervalMinutes must be positive.");
  }

  for (const [day, windows] of Object.entries(config.availability)) {
    for (const window of windows ?? []) {
      if (parseTimeToMinutes(window.start) >= parseTimeToMinutes(window.end)) {
        throw new Error(`Availability window for ${day} must end after it starts.`);
      }
    }
  }
}

function generateSlotsForWindow(
  date: LocalDate,
  window: AvailabilityWindow,
  service: Service,
  intervalMinutes: number
): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const windowStart = parseTimeToMinutes(window.start);
  const windowEnd = parseTimeToMinutes(window.end);

  for (
    let startMinutes = windowStart;
    startMinutes + service.durationMinutes <= windowEnd;
    startMinutes += intervalMinutes
  ) {
    const start = dateTimeFromLocalParts(date, startMinutes);
    const end = dateTimeFromLocalParts(date, startMinutes + service.durationMinutes);

    slots.push({
      serviceId: service.id,
      start: start.toISOString(),
      end: end.toISOString()
    });
  }

  return slots;
}

function getWeekday(date: LocalDate): Weekday {
  return weekdays[dateFromUtcDate(date).getUTCDay()];
}

function dateFromUtcDate(date: LocalDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function dateTimeFromLocalParts(date: LocalDate, minutesAfterMidnight: number): Date {
  const day = dateFromUtcDate(date);
  day.setUTCMinutes(minutesAfterMidnight);
  return day;
}

function parseTimeToMinutes(time: LocalTime): number {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new Error(`Invalid time: ${time}`);
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time: ${time}`);
  }

  return hours * 60 + minutes;
}

function addMinutes(epochMs: number, minutes: number): number {
  return epochMs + minutes * 60_000;
}
