/** Days of the week used by weekly availability and recurrence rules. */
export type Weekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

/** Calendar date in `YYYY-MM-DD` format, interpreted in the configured business time zone. */
export type LocalDate = `${number}-${number}-${number}`;
/** Wall-clock time in `HH:mm` format. */
export type LocalTime = `${number}:${number}`;
/** ISO date-time string with `Z` or an explicit numeric offset. */
export type IsoDateTime = string;

/** A bookable service and its required duration. */
export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
}

/** A start/end availability range inside a single business day. */
export interface AvailabilityWindow {
  start: LocalTime;
  end: LocalTime;
}

/** Base weekly business availability keyed by weekday. */
export type WeeklyAvailability = Partial<Record<Weekday, readonly AvailabilityWindow[]>>;

/** Date-specific availability that replaces the normal weekly schedule for that date. */
export interface DateAvailabilityOverride {
  date: LocalDate;
  windows: readonly AvailabilityWindow[];
}

/** Weekly recurring rule that adds extra availability windows on matching dates. */
export interface RecurringAvailabilityRule {
  frequency: "weekly";
  weekdays: readonly Weekday[];
  windows: readonly AvailabilityWindow[];
  startDate?: LocalDate;
  endDate?: LocalDate;
}

/** Weekly recurring rule that suppresses availability on matching dates. */
export interface RecurringBlackoutRule {
  frequency: "weekly";
  weekdays: readonly Weekday[];
  startDate?: LocalDate;
  endDate?: LocalDate;
}

/** A confirmed booking stored by the system. */
export interface Booking {
  id: string;
  serviceId: string;
  start: IsoDateTime;
  end: IsoDateTime;
}

/** A temporary reservation that blocks a slot until it expires or is confirmed. */
export interface BookingHold {
  id: string;
  slot: BookingSlot;
  expiresAt: IsoDateTime;
}

/** A generated slot for a service with explicit start and end timestamps. */
export interface BookingSlot {
  serviceId: string;
  start: IsoDateTime;
  end: IsoDateTime;
}

/** Capacity-style rules applied after base availability and conflict checks. */
export interface BookingRules {
  maxBookingsPerDay?: number;
  maxBookingsPerServicePerDay?: number;
}

/** Resolved availability metadata for a single local business date. */
export interface DateAvailability {
  date: LocalDate;
  weekday: Weekday;
  isBlackoutDate: boolean;
  isRecurringBlackout: boolean;
  isOverride: boolean;
  hasRecurringAvailability: boolean;
  windows: readonly AvailabilityWindow[];
  timeZone: string;
}

/** Full engine configuration for in-memory scheduling decisions. */
export interface BookingEngineConfig {
  services: readonly Service[];
  availability: WeeklyAvailability;
  bookings?: readonly Booking[];
  holds?: readonly BookingHold[];
  bufferMinutes?: number;
  blackoutDates?: readonly LocalDate[];
  dateOverrides?: readonly DateAvailabilityOverride[];
  recurringAvailability?: readonly RecurringAvailabilityRule[];
  recurringBlackoutRules?: readonly RecurringBlackoutRule[];
  bookingRules?: BookingRules;
  minimumNoticeMinutes?: number;
  maxAdvanceDays?: number;
  now?: IsoDateTime;
  slotIntervalMinutes?: number;
  timeZone?: string;
}

/** Persisted bookings and holds loaded from storage. */
export interface BookingRepositorySnapshot {
  bookings: readonly Booking[];
  holds: readonly BookingHold[];
}

/** Opaque optimistic-concurrency version returned by storage. */
export type BookingRepositoryVersion = string | number;

/** Repository snapshot that includes a storage version for optimistic concurrency. */
export interface VersionedBookingRepositorySnapshot extends BookingRepositorySnapshot {
  version: BookingRepositoryVersion;
}

/** Read-only storage contract for loading persisted bookings and holds. */
export interface BookingRepositoryReader {
  getSnapshot(): Promise<BookingRepositorySnapshot>;
}

/** Write-side storage contract for applications that persist bookings and holds. */
export interface BookingRepositoryWriter {
  saveBooking(booking: Booking): Promise<void>;
  saveHold(hold: BookingHold): Promise<void>;
  releaseHold(holdId: string): Promise<void>;
}

/** Combined read/write storage contract for booking persistence. */
export interface BookingRepository extends BookingRepositoryReader, BookingRepositoryWriter {}

/** Read-only versioned repository contract used by optimistic-concurrency flows. */
export interface VersionedBookingRepositoryReader {
  getSnapshot(): Promise<VersionedBookingRepositorySnapshot>;
}

/** Commit payload for persisting a confirmed booking against an expected repository version. */
export interface CommitBookingChangeInput {
  expectedVersion: BookingRepositoryVersion;
  booking: Booking;
  releaseHoldId?: string;
}

/** Storage commit result for versioned booking confirmation. */
export interface CommitBookingChangeResult {
  status: "committed" | "version-mismatch" | "duplicate-booking-id";
}

/** Write-side versioned repository contract for optimistic-concurrency booking commits. */
export interface VersionedBookingRepositoryWriter {
  commitBookingChange(input: CommitBookingChangeInput): Promise<CommitBookingChangeResult>;
}

/** Combined read/write versioned repository contract. */
export interface VersionedBookingRepository
  extends VersionedBookingRepositoryReader,
    BookingRepositoryWriter,
    VersionedBookingRepositoryWriter {}

/** Input for hydrating a pure booking engine from persisted repository state. */
export interface CreateBookingEngineFromRepositoryInput
  extends Omit<BookingEngineConfig, "bookings" | "holds"> {
  repository: BookingRepositoryReader;
}

/** Loaded repository context that bundles a hydrated engine with the source snapshot. */
export interface BookingEngineRepositoryContext<
  TSnapshot extends BookingRepositorySnapshot = BookingRepositorySnapshot
> {
  engine: BookingEngine;
  snapshot: TSnapshot;
}

/** Input for optimistic-concurrency confirmation against versioned storage. */
export interface ConfirmBookingWithVersionInput
  extends Omit<BookingEngineConfig, "bookings" | "holds"> {
  repository: VersionedBookingRepository;
  expectedVersion: BookingRepositoryVersion;
  bookingId: string;
  slot: BookingSlot;
  holdId?: string;
}

/** Input for optimistic-concurrency confirmation using a pre-hydrated engine. */
export interface ConfirmBookingWithVersionUsingEngineInput {
  engine: BookingEngine;
  repository: VersionedBookingRepository;
  expectedVersion: BookingRepositoryVersion;
  bookingId: string;
  slot: BookingSlot;
  holdId?: string;
}

/** Input for optimistic-concurrency confirmation with a bounded retry-on-stale-version flow. */
export interface ConfirmBookingWithRetryInput
  extends Omit<CreateBookingEngineFromRepositoryInput, "repository"> {
  repository: VersionedBookingRepository;
  bookingId: string;
  slot: BookingSlot;
  holdId?: string;
  maxVersionRetries?: number;
}

/** Seed data for the built-in in-memory repository helper. */
export interface InMemoryBookingRepositoryInput {
  bookings?: readonly Booking[];
  holds?: readonly BookingHold[];
  initialVersion?: BookingRepositoryVersion;
}

/** Input for listing generated slots for a service on a local date. */
export interface GetAvailableSlotsInput {
  serviceId: string;
  date: LocalDate;
}

/** Input for creating or confirming a booking from a slot. */
export interface CreateBookingInput {
  id: string;
  slot: BookingSlot;
}

/** Alias for direct booking confirmation input. */
export type ConfirmBookingInput = CreateBookingInput;

/** Input for creating a temporary hold on a slot. */
export interface CreateBookingHoldInput {
  id: string;
  slot: BookingSlot;
  expiresAt: IsoDateTime;
}

/** Input for confirming a booking from an existing hold. */
export interface ConfirmHeldBookingInput {
  holdId: string;
  bookingId: string;
}

/** Slot-level reason codes returned by availability diagnostics. */
export type BookingUnavailabilityReason =
  | "unknown-service"
  | "invalid-slot-duration"
  | "outside-availability"
  | "blackout-date"
  | "conflict"
  | "minimum-notice"
  | "max-advance"
  | "max-bookings-per-day"
  | "max-bookings-per-service-per-day";

/** Availability decision for a single slot. */
export interface SlotAvailabilityResult {
  available: boolean;
  reason?: BookingUnavailabilityReason;
}

/** Generated slot enriched with availability diagnostics. */
export interface DiagnosedBookingSlot extends BookingSlot {
  available: boolean;
  reason?: BookingUnavailabilityReason;
}

/** Booking workflow failure reasons used by hold and confirmation flows. */
export type BookingFailureReason =
  | "slot-unavailable"
  | "duplicate-booking-id"
  | "hold-not-found"
  | "hold-expired"
  | "version-mismatch";

/** Successful booking decision carrying a confirmed resource. */
export interface BookingDecisionConfirmed<TResource> {
  status: "confirmed";
  resource: TResource;
  engine: BookingEngine;
}

/** Successful hold decision carrying a held resource. */
export interface BookingDecisionHeld<TResource> {
  status: "held";
  resource: TResource;
  engine: BookingEngine;
}

/** Idempotent outcome carrying the existing persisted resource. */
export interface BookingDecisionDuplicate<TResource> {
  status: "duplicate";
  resource: TResource;
  engine: BookingEngine;
}

/** Unsuccessful booking decision carrying a normalized failure reason. */
export interface BookingDecisionUnavailable {
  status: "unavailable";
  reason: BookingFailureReason;
  engine: BookingEngine;
}

/** Normalized result for direct, held, and versioned booking confirmation flows. */
export type BookingConfirmationResult =
  | BookingDecisionConfirmed<Booking>
  | BookingDecisionDuplicate<Booking>
  | BookingDecisionUnavailable;

/** Normalized result for hold creation flows. */
export type BookingHoldResult =
  | BookingDecisionHeld<BookingHold>
  | BookingDecisionDuplicate<BookingHold>
  | BookingDecisionUnavailable;

/** Headless scheduling engine API exposed by `@openbooking/core`. */
export interface BookingEngine {
  /** Returns the configured services. */
  getServices(): readonly Service[];
  /** Returns only the slots that are currently bookable for the given service and date. */
  getAvailableSlots(input: GetAvailableSlotsInput): BookingSlot[];
  /** Returns all generated slots for the date plus availability diagnostics for each slot. */
  getSlotsWithAvailability(input: GetAvailableSlotsInput): DiagnosedBookingSlot[];
  /** Returns all active, non-expired holds currently loaded into the engine. */
  getHolds(): readonly BookingHold[];
  /** Returns whether the slot overlaps an existing confirmed booking, including buffer time. */
  hasConflict(slot: BookingSlot): boolean;
  /** Returns whether the slot is currently bookable. */
  isSlotAvailable(slot: BookingSlot): boolean;
  /** Returns a normalized availability decision for a single slot. */
  getSlotAvailability(slot: BookingSlot): SlotAvailabilityResult;
  /** Returns resolved availability metadata for a local business date. */
  getAvailabilityForDate(date: LocalDate): DateAvailability;
  /** Looks up a configured service by id. */
  getService(serviceId: string): Service | undefined;
  /** Validates a slot and returns a booking shape without mutating persistence. */
  createBooking(input: CreateBookingInput): Booking;
  /** Attempts to create a temporary hold for a slot. */
  createHold(input: CreateBookingHoldInput): BookingHoldResult;
  /** Confirms a booking directly against the in-memory engine state. */
  confirmBooking(input: ConfirmBookingInput): BookingConfirmationResult;
  /** Confirms a booking from an existing hold loaded into the engine. */
  confirmHeldBooking(input: ConfirmHeldBookingInput): BookingConfirmationResult;
  /** Returns a new engine instance with the booking added to in-memory state. */
  addBooking(booking: Booking): BookingEngine;
  /** Returns a new engine instance with the hold added to in-memory state. */
  addHold(hold: BookingHold): BookingEngine;
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

/** Creates a pure in-memory booking engine from the supplied scheduling configuration. */
export function createBookingEngine(config: BookingEngineConfig): BookingEngine {
  validateConfig(config);

  const services = new Map(config.services.map((service) => [service.id, service]));
  const serviceList = [...config.services];
  const bookings = config.bookings ?? [];
  const nowEpochMs = config.now ? parseIsoDateTime(config.now) : Date.now();
  const holds = config.holds ?? [];
  const activeHolds = holds.filter((hold) => parseIsoDateTime(hold.expiresAt) > nowEpochMs);
  const bufferMinutes = config.bufferMinutes ?? 0;
  const minimumNoticeMinutes = config.minimumNoticeMinutes ?? 0;
  const maxAdvanceDays = config.maxAdvanceDays;
  const slotIntervalMinutes = config.slotIntervalMinutes ?? 15;
  const blackoutDates = new Set(config.blackoutDates ?? []);
  const dateOverrides = new Map(
    (config.dateOverrides ?? []).map((override) => [override.date, override])
  );
  const recurringAvailability = config.recurringAvailability ?? [];
  const recurringBlackoutRules = config.recurringBlackoutRules ?? [];
  const bookingRules = config.bookingRules;
  const timeZone = config.timeZone ?? "UTC";
  const hasBookingConstraints =
    config.minimumNoticeMinutes !== undefined || config.maxAdvanceDays !== undefined;

  function getServices(): readonly Service[] {
    return serviceList;
  }

  function getService(serviceId: string): Service | undefined {
    return services.get(serviceId);
  }

  function getHolds(): readonly BookingHold[] {
    return activeHolds;
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

  function hasHoldConflict(slot: BookingSlot, ignoredHoldId?: string): boolean {
    validateSlot(slot);

    const slotStart = parseIsoDateTime(slot.start);
    const slotEnd = parseIsoDateTime(slot.end);

    return activeHolds.some((hold) => {
      if (ignoredHoldId && hold.id === ignoredHoldId) {
        return false;
      }

      const holdStart = addMinutes(parseIsoDateTime(hold.slot.start), -bufferMinutes);
      const holdEnd = addMinutes(parseIsoDateTime(hold.slot.end), bufferMinutes);

      return slotStart < holdEnd && slotEnd > holdStart;
    });
  }

  function getAvailableSlots(input: GetAvailableSlotsInput): BookingSlot[] {
    validateLocalDate(input.date);

    const service = services.get(input.serviceId);

    if (!service) {
      throw new Error(`Unknown service id: ${input.serviceId}`);
    }

    if (isBlackoutDate(input.date)) {
      return [];
    }

    const windows = getWindowsForDate(input.date);

    return uniqueSlots(
      windows.flatMap((window) =>
        generateSlotsForWindow(input.date, window, service, slotIntervalMinutes, timeZone)
          .map((slot) => ({ slot, availability: getSlotAvailability(slot) }))
          .filter(({ availability }) => availability.available)
          .map(({ slot }) => slot)
      )
    );
  }

  function getSlotsWithAvailability(input: GetAvailableSlotsInput): DiagnosedBookingSlot[] {
    validateLocalDate(input.date);

    const service = services.get(input.serviceId);

    if (!service) {
      throw new Error(`Unknown service id: ${input.serviceId}`);
    }

    if (isBlackoutDate(input.date)) {
      return [];
    }

    const windows = getWindowsForDate(input.date);

    return uniqueDiagnosedSlots(
      windows.flatMap((window) =>
        generateSlotsForWindow(input.date, window, service, slotIntervalMinutes, timeZone).map(
          (slot) => {
            const availability = getSlotAvailability(slot);

            return {
              ...slot,
              available: availability.available,
              reason: availability.reason
            };
          }
        )
      )
    );
  }

  function isSlotAvailable(slot: BookingSlot): boolean {
    return getSlotAvailability(slot).available;
  }

  function getSlotAvailability(slot: BookingSlot): SlotAvailabilityResult {
    validateSlot(slot);

    const service = services.get(slot.serviceId);

    if (!service) {
      return { available: false, reason: "unknown-service" };
    }

    const date = getLocalDateFromIsoDateTime(slot.start, timeZone);
    const slotDurationMinutes =
      (parseIsoDateTime(slot.end) - parseIsoDateTime(slot.start)) / 60_000;

    if (slotDurationMinutes !== service.durationMinutes) {
      return { available: false, reason: "invalid-slot-duration" };
    }

    if (isBlackoutDate(date)) {
      return { available: false, reason: "blackout-date" };
    }

    if (!matchesAvailabilityWindows(slot, date)) {
      return { available: false, reason: "outside-availability" };
    }

    if (hasConflict(slot)) {
      return { available: false, reason: "conflict" };
    }

    if (hasHoldConflict(slot)) {
      return { available: false, reason: "conflict" };
    }

    const bookingConstraintReason = getBookingConstraintFailureReason(slot);

    if (bookingConstraintReason) {
      return { available: false, reason: bookingConstraintReason };
    }

    const productionRuleReason = getProductionBookingRuleFailureReason(slot);

    if (productionRuleReason) {
      return { available: false, reason: productionRuleReason };
    }

    return { available: true };
  }

  function getAvailabilityForDate(date: LocalDate): DateAvailability {
    validateLocalDate(date);

    const weekday = getWeekday(date);
    const override = dateOverrides.get(date);
    const recurringWindows = getRecurringAvailabilityWindows(date);

    return {
      date,
      weekday,
      isBlackoutDate: blackoutDates.has(date),
      isRecurringBlackout: matchesRecurringBlackoutRule(date),
      isOverride: Boolean(override),
      hasRecurringAvailability: recurringWindows.length > 0,
      windows: override?.windows ?? mergeAvailabilityWindows(config.availability[weekday] ?? [], recurringWindows),
      timeZone
    };
  }

  function createBooking(input: CreateBookingInput): Booking {
    if (findBookingById(input.id)) {
      throw new Error(`Booking id already exists: ${input.id}`);
    }

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

  function createHold(input: CreateBookingHoldInput): BookingHoldResult {
    const existingHold = findHoldById(input.id);

    if (existingHold) {
      if (isSameHold(existingHold, input)) {
        return {
          status: "duplicate",
          resource: existingHold,
          engine: createBookingEngine({ ...config, holds })
        };
      }

      return {
        status: "unavailable",
        engine: createBookingEngine({ ...config, holds }),
        reason: "duplicate-booking-id"
      };
    }

    validateHoldExpiry(input.expiresAt, nowEpochMs);

    if (!getSlotAvailability(input.slot).available) {
      return {
        status: "unavailable",
        engine: createBookingEngine({ ...config, holds }),
        reason: "slot-unavailable"
      };
    }

    const hold: BookingHold = {
      id: input.id,
      slot: input.slot,
      expiresAt: input.expiresAt
    };
    const nextEngine = addHold(hold);

    return {
      status: "held",
      resource: hold,
      engine: nextEngine
    };
  }

  function confirmBooking(input: ConfirmBookingInput): BookingConfirmationResult {
    const existingBooking = findBookingById(input.id);

    if (existingBooking) {
      if (isSameBooking(existingBooking, input)) {
        return {
          status: "duplicate",
          resource: existingBooking,
          engine: createBookingEngine(config)
        };
      }

      return {
        status: "unavailable",
        engine: createBookingEngine(config),
        reason: "duplicate-booking-id"
      };
    }

    if (!isSlotAvailable(input.slot)) {
      return {
        status: "unavailable",
        engine: createBookingEngine(config),
        reason: "slot-unavailable"
      };
    }

    const booking = {
      id: input.id,
      serviceId: input.slot.serviceId,
      start: input.slot.start,
      end: input.slot.end
    };
    const nextEngine = addBooking(booking);

    return {
      status: "confirmed",
      resource: booking,
      engine: nextEngine
    };
  }

  function confirmHeldBooking(input: ConfirmHeldBookingInput): BookingConfirmationResult {
    const hold = findHoldById(input.holdId);

    if (!hold) {
      return {
        status: "unavailable",
        engine: createBookingEngine({ ...config, holds }),
        reason: "hold-not-found"
      };
    }

    if (parseIsoDateTime(hold.expiresAt) <= nowEpochMs) {
      return {
        status: "unavailable",
        engine: createBookingEngine({ ...config, holds: holds.filter((item) => item.id !== hold.id) }),
        reason: "hold-expired"
      };
    }

    if (findBookingById(input.bookingId)) {
      return {
        status: "unavailable",
        engine: createBookingEngine({ ...config, holds }),
        reason: "duplicate-booking-id"
      };
    }

    if (hasConflict(hold.slot) || hasHoldConflict(hold.slot, hold.id)) {
      return {
        status: "unavailable",
        engine: createBookingEngine({ ...config, holds }),
        reason: "slot-unavailable"
      };
    }

    const booking: Booking = {
      id: input.bookingId,
      serviceId: hold.slot.serviceId,
      start: hold.slot.start,
      end: hold.slot.end
    };

    const nextEngine = createBookingEngine({
      ...config,
      bookings: [...bookings, booking],
      holds: holds.filter((item) => item.id !== hold.id)
    });

    return {
      status: "confirmed",
      resource: booking,
      engine: nextEngine
    };
  }

  function addBooking(booking: Booking): BookingEngine {
    validateBooking(booking, new Set(services.keys()));

    return createBookingEngine({
      ...config,
      bookings: [...bookings, booking]
    });
  }

  function addHold(hold: BookingHold): BookingEngine {
    validateHold(hold, new Set(services.keys()), nowEpochMs);

    return createBookingEngine({
      ...config,
      holds: [...holds, hold]
    });
  }

  function getWindowsForDate(date: LocalDate): readonly AvailabilityWindow[] {
    const override = dateOverrides.get(date);

    if (override) {
      return override.windows;
    }

    const weekday = getWeekday(date);
    return mergeAvailabilityWindows(
      config.availability[weekday] ?? [],
      getRecurringAvailabilityWindows(date)
    );
  }

  function getRecurringAvailabilityWindows(date: LocalDate): readonly AvailabilityWindow[] {
    const weekday = getWeekday(date);

    return recurringAvailability.flatMap((rule) =>
      matchesWeeklyRule(date, weekday, rule) ? rule.windows : []
    );
  }

  function matchesRecurringBlackoutRule(date: LocalDate): boolean {
    const weekday = getWeekday(date);

    return recurringBlackoutRules.some((rule) => matchesWeeklyRule(date, weekday, rule));
  }

  function isBlackoutDate(date: LocalDate): boolean {
    return blackoutDates.has(date) || matchesRecurringBlackoutRule(date);
  }

  function getBookingConstraintFailureReason(
    slot: BookingSlot
  ): Extract<BookingUnavailabilityReason, "minimum-notice" | "max-advance"> | undefined {
    if (!hasBookingConstraints || nowEpochMs === null) {
      return undefined;
    }

    const slotStart = parseIsoDateTime(slot.start);
    const minimumBookableStart = addMinutes(nowEpochMs, minimumNoticeMinutes);

    if (slotStart < minimumBookableStart) {
      return "minimum-notice";
    }

    if (maxAdvanceDays === undefined) {
      return undefined;
    }

    const latestBookableStart = addDays(nowEpochMs, maxAdvanceDays);
    return slotStart <= latestBookableStart ? undefined : "max-advance";
  }

  function getProductionBookingRuleFailureReason(
    slot: BookingSlot
  ):
    | Extract<
        BookingUnavailabilityReason,
        "max-bookings-per-day" | "max-bookings-per-service-per-day"
      >
    | undefined {
    if (!bookingRules) {
      return undefined;
    }

    const date = getLocalDateFromIsoDateTime(slot.start, timeZone);

    if (
      bookingRules.maxBookingsPerDay !== undefined &&
      countBookingsForDate(date) >= bookingRules.maxBookingsPerDay
    ) {
      return "max-bookings-per-day";
    }

    if (
      bookingRules.maxBookingsPerServicePerDay !== undefined &&
      countBookingsForDate(date, slot.serviceId) >= bookingRules.maxBookingsPerServicePerDay
    ) {
      return "max-bookings-per-service-per-day";
    }

    return undefined;
  }

  function countBookingsForDate(date: LocalDate, serviceId?: string): number {
    return bookings.filter((booking) => {
      if (serviceId && booking.serviceId !== serviceId) {
        return false;
      }

      return getLocalDateFromIsoDateTime(booking.start, timeZone) === date;
    }).length;
  }

  function findBookingById(id: string): Booking | undefined {
    return bookings.find((booking) => booking.id === id);
  }

  function findHoldById(id: string): BookingHold | undefined {
    return holds.find((hold) => hold.id === id);
  }

  function matchesAvailabilityWindows(slot: BookingSlot, date: LocalDate): boolean {
    return getWindowsForDate(date).some((window) =>
      isSlotWithinWindow(slot, date, window, timeZone)
    );
  }

  return {
    getServices,
    getAvailableSlots,
    getSlotsWithAvailability,
    getHolds,
    hasConflict,
    isSlotAvailable,
    getSlotAvailability,
    getAvailabilityForDate,
    getService,
    createBooking,
    createHold,
    confirmBooking,
    confirmHeldBooking,
    addBooking
    ,
    addHold
  };
}

/**
 * Creates a mutable in-memory repository that implements the versioned storage contracts.
 *
 * This helper is intended for tests, examples, demos, and lightweight backend prototypes.
 */
export function createInMemoryRepository(
  input: InMemoryBookingRepositoryInput = {}
): VersionedBookingRepository {
  let bookings = [...(input.bookings ?? [])];
  let holds = [...(input.holds ?? [])];
  let version = input.initialVersion ?? 0;

  return {
    async getSnapshot() {
      return {
        version,
        bookings: [...bookings],
        holds: [...holds]
      };
    },
    async saveBooking(booking: Booking) {
      bookings = [...bookings, booking];
      version = incrementRepositoryVersion(version);
    },
    async saveHold(hold: BookingHold) {
      holds = [...holds.filter((item) => item.id !== hold.id), hold];
      version = incrementRepositoryVersion(version);
    },
    async releaseHold(holdId: string) {
      holds = holds.filter((hold) => hold.id !== holdId);
      version = incrementRepositoryVersion(version);
    },
    async commitBookingChange(commitInput) {
      if (commitInput.expectedVersion !== version) {
        return { status: "version-mismatch" as const };
      }

      if (bookings.some((booking) => booking.id === commitInput.booking.id)) {
        return { status: "duplicate-booking-id" as const };
      }

      bookings = [...bookings, commitInput.booking];

      if (commitInput.releaseHoldId) {
        holds = holds.filter((hold) => hold.id !== commitInput.releaseHoldId);
      }

      version = incrementRepositoryVersion(version);

      return { status: "committed" as const };
    }
  };
}

/**
 * Loads persisted bookings and holds from a repository and returns both the
 * hydrated engine and the snapshot that produced it.
 */
export async function loadBookingEngineFromRepository<
  TRepository extends BookingRepositoryReader,
  TSnapshot extends Awaited<ReturnType<TRepository["getSnapshot"]>>
>(
  input: Omit<CreateBookingEngineFromRepositoryInput, "repository"> & {
    repository: TRepository;
  }
): Promise<BookingEngineRepositoryContext<TSnapshot>> {
  const snapshot = (await input.repository.getSnapshot()) as TSnapshot;
  const engine = createBookingEngine({
    services: input.services,
    availability: input.availability,
    bookings: snapshot.bookings,
    holds: snapshot.holds,
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
  });

  return {
    engine,
    snapshot
  };
}

/** Loads persisted bookings and holds from a repository and returns a pure booking engine. */
export async function createBookingEngineFromRepository(
  input: CreateBookingEngineFromRepositoryInput
): Promise<BookingEngine> {
  const context = await loadBookingEngineFromRepository(input);

  return context.engine;
}

/**
 * Confirms a booking against a versioned repository snapshot using optimistic concurrency.
 *
 * This helper loads the latest snapshot, validates the booking or held booking,
 * and then attempts to persist it with the supplied `expectedVersion`.
 */
export async function confirmBookingWithVersion(
  input: ConfirmBookingWithVersionInput
): Promise<BookingConfirmationResult> {
  const snapshot = await input.repository.getSnapshot();
  const engine = createBookingEngine({
    services: input.services,
    availability: input.availability,
    bookings: snapshot.bookings,
    holds: snapshot.holds,
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
  });

  return confirmBookingWithVersionUsingEngine({
    engine,
    repository: input.repository,
    expectedVersion: input.expectedVersion,
    bookingId: input.bookingId,
    slot: input.slot,
    holdId: input.holdId
  });
}

/**
 * Confirms a booking against a versioned repository using an already-hydrated engine.
 *
 * This keeps server-side confirmation flows from repeating scheduling config
 * after the latest snapshot has already been loaded into an engine instance.
 */
export async function confirmBookingWithVersionUsingEngine(
  input: ConfirmBookingWithVersionUsingEngineInput
): Promise<BookingConfirmationResult> {
  const confirmation = input.holdId
    ? input.engine.confirmHeldBooking({
        holdId: input.holdId,
        bookingId: input.bookingId
      })
    : input.engine.confirmBooking({
        id: input.bookingId,
        slot: input.slot
      });

  if (confirmation.status !== "confirmed") {
    return confirmation;
  }

  const commitResult = await input.repository.commitBookingChange({
    expectedVersion: input.expectedVersion,
    booking: confirmation.resource,
    releaseHoldId: input.holdId
  });

  if (commitResult.status === "version-mismatch") {
    return {
      status: "unavailable",
      engine: input.engine,
      reason: "version-mismatch"
    };
  }

  if (commitResult.status === "duplicate-booking-id") {
    return {
      status: "unavailable",
      engine: input.engine,
      reason: "duplicate-booking-id"
    };
  }

  return confirmation;
}

/**
 * Loads the latest repository snapshot, attempts a versioned confirmation, and
 * retries on `version-mismatch` up to `maxVersionRetries`.
 */
export async function confirmBookingWithRetry(
  input: ConfirmBookingWithRetryInput
): Promise<BookingConfirmationResult> {
  const maxVersionRetries = input.maxVersionRetries ?? 1;

  if (!Number.isInteger(maxVersionRetries) || maxVersionRetries < 0) {
    throw new Error("maxVersionRetries must be a non-negative integer.");
  }

  for (let attempt = 0; attempt <= maxVersionRetries; attempt += 1) {
    const { engine, snapshot } = await loadBookingEngineFromRepository({
      services: input.services,
      availability: input.availability,
      repository: input.repository,
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
    });

    const confirmation = await confirmBookingWithVersionUsingEngine({
      engine,
      repository: input.repository,
      expectedVersion:
        "version" in snapshot
          ? snapshot.version
          : (() => {
              throw new Error("Versioned confirmation requires a repository snapshot version.");
            })(),
      bookingId: input.bookingId,
      slot: input.slot,
      holdId: input.holdId
    });

    if (
      confirmation.status !== "unavailable" ||
      confirmation.reason !== "version-mismatch" ||
      attempt === maxVersionRetries
    ) {
      return confirmation;
    }
  }

  throw new Error("Unreachable confirmation retry state.");
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

  for (const rule of config.recurringAvailability ?? []) {
    validateRecurringWeeklyRule(rule, "recurring availability");
    validateAvailabilityWindows("recurring availability", rule.windows);
  }

  for (const rule of config.recurringBlackoutRules ?? []) {
    validateRecurringWeeklyRule(rule, "recurring blackout rule");
  }

  for (const booking of config.bookings ?? []) {
    validateBooking(booking, serviceIds);
  }

  for (const hold of config.holds ?? []) {
    validateHold(hold, serviceIds);
  }

  for (const date of config.blackoutDates ?? []) {
    validateLocalDate(date);
  }

  validateBookingRules(config.bookingRules);
}

function validateBooking(booking: Booking, serviceIds: ReadonlySet<string>): void {
  if (!booking.id.trim()) {
    throw new Error("Booking id is required.");
  }

  if (!serviceIds.has(booking.serviceId)) {
    throw new Error(`Booking '${booking.id}' references unknown service id: ${booking.serviceId}`);
  }

  if (parseIsoDateTime(booking.start) >= parseIsoDateTime(booking.end)) {
    throw new Error(`Booking '${booking.id}' must end after it starts.`);
  }
}

function validateHold(
  hold: BookingHold,
  serviceIds: ReadonlySet<string>,
  nowEpochMs?: number
): void {
  if (!hold.id.trim()) {
    throw new Error("Hold id is required.");
  }

  validateSlot(hold.slot);

  if (!serviceIds.has(hold.slot.serviceId)) {
    throw new Error(`Hold '${hold.id}' references unknown service id: ${hold.slot.serviceId}`);
  }

  parseIsoDateTime(hold.expiresAt);

  if (nowEpochMs !== undefined) {
    validateHoldExpiry(hold.expiresAt, nowEpochMs);
  }
}

function validateHoldExpiry(expiresAt: IsoDateTime, nowEpochMs: number): void {
  if (parseIsoDateTime(expiresAt) <= nowEpochMs) {
    throw new Error("Hold expiry must be in the future.");
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

function isSameBooking(existingBooking: Booking, input: ConfirmBookingInput): boolean {
  return (
    existingBooking.serviceId === input.slot.serviceId &&
    existingBooking.start === input.slot.start &&
    existingBooking.end === input.slot.end
  );
}

function isSameHold(existingHold: BookingHold, input: CreateBookingHoldInput): boolean {
  return (
    existingHold.slot.serviceId === input.slot.serviceId &&
    existingHold.slot.start === input.slot.start &&
    existingHold.slot.end === input.slot.end &&
    existingHold.expiresAt === input.expiresAt
  );
}

function validateRecurringWeeklyRule(
  rule: RecurringAvailabilityRule | RecurringBlackoutRule,
  label: string
): void {
  if (rule.frequency !== "weekly") {
    throw new Error(`Unsupported recurrence frequency for ${label}: ${rule.frequency}`);
  }

  if (rule.weekdays.length === 0) {
    throw new Error(`${label} must include at least one weekday.`);
  }

  const seenWeekdays = new Set<Weekday>();

  for (const weekday of rule.weekdays) {
    if (!weekdays.includes(weekday)) {
      throw new Error(`Invalid weekday in ${label}: ${weekday}`);
    }

    if (seenWeekdays.has(weekday)) {
      throw new Error(`Duplicate weekday in ${label}: ${weekday}`);
    }

    seenWeekdays.add(weekday);
  }

  if (rule.startDate) {
    validateLocalDate(rule.startDate);
  }

  if (rule.endDate) {
    validateLocalDate(rule.endDate);
  }

  if (rule.startDate && rule.endDate && rule.startDate > rule.endDate) {
    throw new Error(`${label} startDate must be on or before endDate.`);
  }
}

function validateBookingRules(bookingRules: BookingRules | undefined): void {
  if (!bookingRules) {
    return;
  }

  validateNonNegativeIntegerRule(bookingRules.maxBookingsPerDay, "maxBookingsPerDay");
  validateNonNegativeIntegerRule(
    bookingRules.maxBookingsPerServicePerDay,
    "maxBookingsPerServicePerDay"
  );
}

function validateNonNegativeIntegerRule(value: number | undefined, label: string): void {
  if (value === undefined) {
    return;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
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

function uniqueDiagnosedSlots(slots: DiagnosedBookingSlot[]): DiagnosedBookingSlot[] {
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

function mergeAvailabilityWindows(
  baseWindows: readonly AvailabilityWindow[],
  recurringWindows: readonly AvailabilityWindow[]
): AvailabilityWindow[] {
  const seen = new Set<string>();

  return [...baseWindows, ...recurringWindows].filter((window) => {
    const key = `${window.start}:${window.end}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function matchesWeeklyRule(
  date: LocalDate,
  weekday: Weekday,
  rule: RecurringAvailabilityRule | RecurringBlackoutRule
): boolean {
  return (
    rule.weekdays.includes(weekday) &&
    (rule.startDate === undefined || date >= rule.startDate) &&
    (rule.endDate === undefined || date <= rule.endDate)
  );
}

function isSlotWithinWindow(
  slot: BookingSlot,
  date: LocalDate,
  window: AvailabilityWindow,
  timeZone: string
): boolean {
  const slotStart = parseIsoDateTime(slot.start);
  const slotEnd = parseIsoDateTime(slot.end);
  const windowStart = dateTimeFromLocalParts(date, parseTimeToMinutes(window.start), timeZone).getTime();
  const windowEnd = dateTimeFromLocalParts(date, parseTimeToMinutes(window.end), timeZone).getTime();

  return slotStart >= windowStart && slotEnd <= windowEnd;
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

function incrementRepositoryVersion(version: BookingRepositoryVersion): BookingRepositoryVersion {
  if (typeof version === "number") {
    return version + 1;
  }

  const numericVersion = Number(version);

  if (Number.isFinite(numericVersion)) {
    return String(numericVersion + 1);
  }

  return `${version}:next`;
}
