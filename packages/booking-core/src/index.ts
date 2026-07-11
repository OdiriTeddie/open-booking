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

export interface DateAvailability {
  date: LocalDate;
  weekday: Weekday;
  isBlackoutDate: boolean;
  windows: readonly AvailabilityWindow[];
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

export interface CreateBookingInput {
  id: string;
  slot: BookingSlot;
}

export interface BookingEngine {
  getServices(): readonly Service[];
  getAvailableSlots(input: GetAvailableSlotsInput): BookingSlot[];
  hasConflict(slot: BookingSlot): boolean;
  isSlotAvailable(slot: BookingSlot): boolean;
  getAvailabilityForDate(date: LocalDate): DateAvailability;
  getService(serviceId: string): Service | undefined;
  createBooking(input: CreateBookingInput): Booking;
  addBooking(booking: Booking): BookingEngine;
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
  validateConfig(config);

  const services = new Map(config.services.map((service) => [service.id, service]));
  const serviceList = [...config.services];
  const bookings = config.bookings ?? [];
  const bufferMinutes = config.bufferMinutes ?? 0;
  const slotIntervalMinutes = config.slotIntervalMinutes ?? 15;
  const blackoutDates = new Set(config.blackoutDates ?? []);

  if (config.timeZone && config.timeZone !== "utc") {
    throw new Error("Only the 'utc' timezone mode is supported in the MVP.");
  }

  function getServices(): readonly Service[] {
    return serviceList;
  }

  function getService(serviceId: string): Service | undefined {
    return services.get(serviceId);
  }

  function hasConflict(slot: BookingSlot): boolean {
    validateSlot(slot);

    const slotStart = parseIsoDateTime(slot.start);
    const slotEnd = parseIsoDateTime(slot.end);

    return bookings.some((booking) => {
      const bookingStart = addMinutes(parseIsoDateTime(booking.start), -bufferMinutes);
      const bookingEnd = addMinutes(parseIsoDateTime(booking.end), bufferMinutes);

      return slotStart < bookingEnd && slotEnd > bookingStart;
    });
  }

  function getAvailableSlots(input: GetAvailableSlotsInput): BookingSlot[] {
    validateLocalDate(input.date);

    const service = services.get(input.serviceId);

    if (!service) {
      throw new Error(`Unknown service id: ${input.serviceId}`);
    }

    if (blackoutDates.has(input.date)) {
      return [];
    }

    const weekday = getWeekday(input.date);
    const windows = config.availability[weekday] ?? [];

    return uniqueSlots(
      windows.flatMap((window) =>
        generateSlotsForWindow(input.date, window, service, slotIntervalMinutes).filter(
          (slot) => !hasConflict(slot)
        )
      )
    );
  }

  function isSlotAvailable(slot: BookingSlot): boolean {
    validateSlot(slot);

    const service = services.get(slot.serviceId);

    if (!service) {
      throw new Error(`Unknown service id: ${slot.serviceId}`);
    }

    const date = slot.start.slice(0, 10) as LocalDate;
    const slotDurationMinutes =
      (parseIsoDateTime(slot.end) - parseIsoDateTime(slot.start)) / 60_000;

    if (slotDurationMinutes !== service.durationMinutes) {
      return false;
    }

    return getAvailableSlots({ serviceId: slot.serviceId, date }).some(
      (availableSlot) => availableSlot.start === slot.start && availableSlot.end === slot.end
    );
  }

  function getAvailabilityForDate(date: LocalDate): DateAvailability {
    validateLocalDate(date);

    const weekday = getWeekday(date);

    return {
      date,
      weekday,
      isBlackoutDate: blackoutDates.has(date),
      windows: config.availability[weekday] ?? []
    };
  }

  function createBooking(input: CreateBookingInput): Booking {
    if (isSlotAvailable(input.slot) === false) {
      throw new Error("Cannot create a booking for an unavailable slot.");
    }

    return {
      id: input.id,
      serviceId: input.slot.serviceId,
      start: input.slot.start,
      end: input.slot.end
    };
  }

  function addBooking(booking: Booking): BookingEngine {
    validateBooking(booking, new Set(services.keys()));

    return createBookingEngine({
      ...config,
      bookings: [...bookings, booking]
    });
  }

  return {
    getServices,
    getAvailableSlots,
    hasConflict,
    isSlotAvailable,
    getAvailabilityForDate,
    getService,
    createBooking,
    addBooking
  };
}

function validateConfig(config: BookingEngineConfig): void {
  if (config.services.length === 0) {
    throw new Error("At least one service is required.");
  }

  const serviceIds = new Set<string>();

  for (const service of config.services) {
    if (!service.id.trim()) {
      throw new Error("Service id is required.");
    }

    if (serviceIds.has(service.id)) {
      throw new Error(`Duplicate service id: ${service.id}`);
    }

    serviceIds.add(service.id);

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

  for (const booking of config.bookings ?? []) {
    validateBooking(booking, serviceIds);
  }

  for (const date of config.blackoutDates ?? []) {
    validateLocalDate(date);
  }
}

function validateBooking(booking: Booking, serviceIds: ReadonlySet<string>): void {
  if (!serviceIds.has(booking.serviceId)) {
    throw new Error(`Booking '${booking.id}' references unknown service id: ${booking.serviceId}`);
  }

  if (parseIsoDateTime(booking.start) >= parseIsoDateTime(booking.end)) {
    throw new Error(`Booking '${booking.id}' must end after it starts.`);
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
  validateLocalDate(date);
  return new Date(`${date}T00:00:00.000Z`);
}

function dateTimeFromLocalParts(date: LocalDate, minutesAfterMidnight: number): Date {
  const day = dateFromUtcDate(date);
  day.setUTCMinutes(minutesAfterMidnight);
  return day;
}

function parseTimeToMinutes(time: LocalTime): number {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(`Invalid time: ${time}`);
  }

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

function validateLocalDate(date: LocalDate): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date: ${date}`);
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`Invalid date: ${date}`);
  }
}

function parseIsoDateTime(value: IsoDateTime): number {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value) || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error(`Invalid ISO date time: ${value}`);
  }

  const epochMs = Date.parse(value);

  if (Number.isNaN(epochMs)) {
    throw new Error(`Invalid ISO date time: ${value}`);
  }

  return epochMs;
}

function validateSlot(slot: BookingSlot): void {
  if (parseIsoDateTime(slot.start) >= parseIsoDateTime(slot.end)) {
    throw new Error("Slot must end after it starts.");
  }
}

function uniqueSlots(slots: BookingSlot[]): BookingSlot[] {
  const seen = new Set<string>();

  return slots.filter((slot) => {
    const key = `${slot.serviceId}:${slot.start}:${slot.end}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
