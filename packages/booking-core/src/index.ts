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

export interface DateAvailabilityOverride {
  date: LocalDate;
  windows: readonly AvailabilityWindow[];
}

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
  isOverride: boolean;
  windows: readonly AvailabilityWindow[];
  timeZone: string;
}

export interface BookingEngineConfig {
  services: readonly Service[];
  availability: WeeklyAvailability;
  bookings?: readonly Booking[];
  bufferMinutes?: number;
  blackoutDates?: readonly LocalDate[];
  dateOverrides?: readonly DateAvailabilityOverride[];
  minimumNoticeMinutes?: number;
  maxAdvanceDays?: number;
  now?: IsoDateTime;
  slotIntervalMinutes?: number;
  timeZone?: string;
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
  const minimumNoticeMinutes = config.minimumNoticeMinutes ?? 0;
  const maxAdvanceDays = config.maxAdvanceDays;
  const slotIntervalMinutes = config.slotIntervalMinutes ?? 15;
  const blackoutDates = new Set(config.blackoutDates ?? []);
  const dateOverrides = new Map(
    (config.dateOverrides ?? []).map((override) => [override.date, override])
  );
  const timeZone = config.timeZone ?? "UTC";
  const hasBookingConstraints =
    config.minimumNoticeMinutes !== undefined || config.maxAdvanceDays !== undefined;
  const nowEpochMs = hasBookingConstraints
    ? config.now
      ? parseIsoDateTime(config.now)
      : Date.now()
    : null;

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

    const windows = getWindowsForDate(input.date);

    return uniqueSlots(
      windows.flatMap((window) =>
        generateSlotsForWindow(input.date, window, service, slotIntervalMinutes, timeZone).filter(
          (slot) => !hasConflict(slot) && satisfiesBookingConstraints(slot)
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

    const date = getLocalDateFromIsoDateTime(slot.start, timeZone);
    const slotDurationMinutes =
      (parseIsoDateTime(slot.end) - parseIsoDateTime(slot.start)) / 60_000;

    if (slotDurationMinutes !== service.durationMinutes) {
      return false;
    }

    if (!satisfiesBookingConstraints(slot)) {
      return false;
    }

    return getAvailableSlots({ serviceId: slot.serviceId, date }).some(
      (availableSlot) => availableSlot.start === slot.start && availableSlot.end === slot.end
    );
  }

  function getAvailabilityForDate(date: LocalDate): DateAvailability {
    validateLocalDate(date);

    const weekday = getWeekday(date);
    const override = dateOverrides.get(date);

    return {
      date,
      weekday,
      isBlackoutDate: blackoutDates.has(date),
      isOverride: Boolean(override),
      windows: override?.windows ?? config.availability[weekday] ?? [],
      timeZone
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

  function getWindowsForDate(date: LocalDate): readonly AvailabilityWindow[] {
    const override = dateOverrides.get(date);

    if (override) {
      return override.windows;
    }

    const weekday = getWeekday(date);
    return config.availability[weekday] ?? [];
  }

  function satisfiesBookingConstraints(slot: BookingSlot): boolean {
    if (!hasBookingConstraints || nowEpochMs === null) {
      return true;
    }

    const slotStart = parseIsoDateTime(slot.start);
    const minimumBookableStart = addMinutes(nowEpochMs, minimumNoticeMinutes);

    if (slotStart < minimumBookableStart) {
      return false;
    }

    if (maxAdvanceDays === undefined) {
      return true;
    }

    const latestBookableStart = addDays(nowEpochMs, maxAdvanceDays);
    return slotStart <= latestBookableStart;
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

  if ((config.minimumNoticeMinutes ?? 0) < 0) {
    throw new Error("minimumNoticeMinutes cannot be negative.");
  }

  if (config.maxAdvanceDays !== undefined && config.maxAdvanceDays < 0) {
    throw new Error("maxAdvanceDays cannot be negative.");
  }

  if ((config.slotIntervalMinutes ?? 15) <= 0) {
    throw new Error("slotIntervalMinutes must be positive.");
  }

  validateTimeZone(config.timeZone ?? "UTC");

  if (config.now) {
    parseIsoDateTime(config.now);
  }

  for (const [day, windows] of Object.entries(config.availability)) {
    validateAvailabilityWindows(day, windows ?? []);
  }

  const overrideDates = new Set<LocalDate>();

  for (const override of config.dateOverrides ?? []) {
    validateLocalDate(override.date);

    if (overrideDates.has(override.date)) {
      throw new Error(`Duplicate date override: ${override.date}`);
    }

    overrideDates.add(override.date);
    validateAvailabilityWindows(`date override ${override.date}`, override.windows);
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
  intervalMinutes: number,
  timeZone: string
): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const windowStart = parseTimeToMinutes(window.start);
  const windowEnd = parseTimeToMinutes(window.end);

  for (
    let startMinutes = windowStart;
    startMinutes + service.durationMinutes <= windowEnd;
    startMinutes += intervalMinutes
  ) {
    const start = dateTimeFromLocalParts(date, startMinutes, timeZone);
    const end = dateTimeFromLocalParts(date, startMinutes + service.durationMinutes, timeZone);

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

function dateTimeFromLocalParts(
  date: LocalDate,
  minutesAfterMidnight: number,
  timeZone: string
): Date {
  const [yearRaw, monthRaw, dayRaw] = date.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hours = Math.floor(minutesAfterMidnight / 60);
  const minutes = minutesAfterMidnight % 60;

  return new Date(zonedDateTimeToUtcEpochMs({ year, month, day, hours, minutes }, timeZone));
}

function validateAvailabilityWindows(
  label: string,
  windows: readonly AvailabilityWindow[]
): void {
  for (const window of windows) {
    if (parseTimeToMinutes(window.start) >= parseTimeToMinutes(window.end)) {
      throw new Error(`Availability window for ${label} must end after it starts.`);
    }
  }
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

function addDays(epochMs: number, days: number): number {
  return epochMs + days * 24 * 60 * 60_000;
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

function validateTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone }).format(new Date());
  } catch {
    throw new Error(`Invalid time zone: ${timeZone}`);
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

function getLocalDateFromIsoDateTime(value: IsoDateTime, timeZone: string): LocalDate {
  const date = new Date(parseIsoDateTime(value));
  const parts = getDateTimeParts(date, timeZone);

  return `${parts.year}-${parts.month}-${parts.day}` as LocalDate;
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

function zonedDateTimeToUtcEpochMs(
  localDateTime: {
    year: number;
    month: number;
    day: number;
    hours: number;
    minutes: number;
  },
  timeZone: string
): number {
  const utcGuess = Date.UTC(
    localDateTime.year,
    localDateTime.month - 1,
    localDateTime.day,
    localDateTime.hours,
    localDateTime.minutes,
    0,
    0
  );

  let candidate = utcGuess - getTimeZoneOffsetMs(utcGuess, timeZone);
  candidate = utcGuess - getTimeZoneOffsetMs(candidate, timeZone);

  if (matchesLocalDateTime(candidate, localDateTime, timeZone)) {
    return candidate;
  }

  const fallbackCandidate = candidate + 60 * 60_000;

  if (matchesLocalDateTime(fallbackCandidate, localDateTime, timeZone)) {
    return fallbackCandidate;
  }

  throw new Error(
    `Local time ${formatLocalDateTime(localDateTime)} does not exist in time zone ${timeZone}`
  );
}

function getTimeZoneOffsetMs(epochMs: number, timeZone: string): number {
  const parts = getDateTimeParts(new Date(epochMs), timeZone);
  const reconstructedUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
    0
  );

  return reconstructedUtc - epochMs;
}

function getDateTimeParts(date: Date, timeZone: string): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return formatter.formatToParts(date).reduce<Record<string, string>>((accumulator, part) => {
    if (part.type !== "literal") {
      accumulator[part.type] = part.value;
    }

    return accumulator;
  }, {});
}

function matchesLocalDateTime(
  epochMs: number,
  localDateTime: {
    year: number;
    month: number;
    day: number;
    hours: number;
    minutes: number;
  },
  timeZone: string
): boolean {
  const parts = getDateTimeParts(new Date(epochMs), timeZone);

  return (
    Number(parts.year) === localDateTime.year &&
    Number(parts.month) === localDateTime.month &&
    Number(parts.day) === localDateTime.day &&
    Number(parts.hour) === localDateTime.hours &&
    Number(parts.minute) === localDateTime.minutes
  );
}

function formatLocalDateTime(localDateTime: {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
}): string {
  return `${String(localDateTime.year).padStart(4, "0")}-${String(localDateTime.month).padStart(2, "0")}-${String(localDateTime.day).padStart(2, "0")}T${String(localDateTime.hours).padStart(2, "0")}:${String(localDateTime.minutes).padStart(2, "0")}`;
}
