import { describe, expect, it } from "vitest";
import { createBookingEngine } from "../src";

const baseConfig = {
  services: [
    { id: "photo-session", name: "Photo Session", durationMinutes: 60 },
    { id: "consultation", name: "Consultation", durationMinutes: 30 }
  ],
  availability: {
    friday: [{ start: "09:00", end: "12:00" }],
    saturday: [{ start: "10:00", end: "14:00" }]
  },
  slotIntervalMinutes: 30
} as const;

describe("createBookingEngine", () => {
  it("generates available slots for a service and date", () => {
    const engine = createBookingEngine(baseConfig);

    const slots = engine.getAvailableSlots({
      serviceId: "photo-session",
      date: "2026-07-10"
    });

    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-07-10T09:00:00.000Z",
      "2026-07-10T09:30:00.000Z",
      "2026-07-10T10:00:00.000Z",
      "2026-07-10T10:30:00.000Z",
      "2026-07-10T11:00:00.000Z"
    ]);
  });

  it("excludes slots that conflict with existing bookings", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bookings: [
        {
          id: "booking-1",
          serviceId: "photo-session",
          start: "2026-07-10T10:00:00.000Z",
          end: "2026-07-10T11:00:00.000Z"
        }
      ]
    });

    const slots = engine.getAvailableSlots({
      serviceId: "photo-session",
      date: "2026-07-10"
    });

    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-07-10T09:00:00.000Z",
      "2026-07-10T11:00:00.000Z"
    ]);
  });

  it("applies buffer time around bookings", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bufferMinutes: 15,
      bookings: [
        {
          id: "booking-1",
          serviceId: "photo-session",
          start: "2026-07-10T10:00:00.000Z",
          end: "2026-07-10T11:00:00.000Z"
        }
      ]
    });

    const slots = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-10"
    });

    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-07-10T09:00:00.000Z",
      "2026-07-10T11:30:00.000Z"
    ]);
  });

  it("returns no slots on blackout dates", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      blackoutDates: ["2026-07-10"]
    });

    expect(
      engine.getAvailableSlots({
        serviceId: "photo-session",
        date: "2026-07-10"
      })
    ).toEqual([]);
  });

  it("uses date overrides instead of weekly availability", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      dateOverrides: [
        {
          date: "2026-07-10",
          windows: [{ start: "13:00", end: "15:00" }]
        }
      ]
    });

    const slots = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-10"
    });

    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-07-10T13:00:00.000Z",
      "2026-07-10T13:30:00.000Z",
      "2026-07-10T14:00:00.000Z",
      "2026-07-10T14:30:00.000Z"
    ]);
  });

  it("returns no slots when a date override has no windows", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      dateOverrides: [
        {
          date: "2026-07-10",
          windows: []
        }
      ]
    });

    expect(
      engine.getAvailableSlots({
        serviceId: "consultation",
        date: "2026-07-10"
      })
    ).toEqual([]);
  });

  it("adds recurring availability windows when a rule matches the date", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      recurringAvailability: [
        {
          frequency: "weekly",
          weekdays: ["friday"],
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          windows: [{ start: "13:00", end: "15:00" }]
        }
      ]
    });

    const slots = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-10"
    });

    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-07-10T09:00:00.000Z",
      "2026-07-10T09:30:00.000Z",
      "2026-07-10T10:00:00.000Z",
      "2026-07-10T10:30:00.000Z",
      "2026-07-10T11:00:00.000Z",
      "2026-07-10T11:30:00.000Z",
      "2026-07-10T13:00:00.000Z",
      "2026-07-10T13:30:00.000Z",
      "2026-07-10T14:00:00.000Z",
      "2026-07-10T14:30:00.000Z"
    ]);
  });

  it("does not apply recurring availability outside its date range", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      recurringAvailability: [
        {
          frequency: "weekly",
          weekdays: ["friday"],
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          windows: [{ start: "13:00", end: "15:00" }]
        }
      ]
    });

    const slots = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-08-07"
    });

    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-08-07T09:00:00.000Z",
      "2026-08-07T09:30:00.000Z",
      "2026-08-07T10:00:00.000Z",
      "2026-08-07T10:30:00.000Z",
      "2026-08-07T11:00:00.000Z",
      "2026-08-07T11:30:00.000Z"
    ]);
  });

  it("filters out slots inside minimum notice", () => {
    const engine = createBookingEngine({
      services: [{ id: "consultation", name: "Consultation", durationMinutes: 30 }],
      availability: {
        friday: [{ start: "09:00", end: "12:00" }]
      },
      slotIntervalMinutes: 30,
      minimumNoticeMinutes: 90,
      now: "2026-07-10T08:00:00.000Z"
    });

    const slots = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-10"
    });

    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-07-10T09:30:00.000Z",
      "2026-07-10T10:00:00.000Z",
      "2026-07-10T10:30:00.000Z",
      "2026-07-10T11:00:00.000Z",
      "2026-07-10T11:30:00.000Z"
    ]);
  });

  it("filters out slots beyond the booking horizon", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      maxAdvanceDays: 3,
      now: "2026-07-10T00:00:00.000Z"
    });

    expect(
      engine.getAvailableSlots({
        serviceId: "consultation",
        date: "2026-07-18"
      })
    ).toEqual([]);
  });

  it("blocks slots when the daily booking cap is already reached", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bookings: [
        {
          id: "booking-1",
          serviceId: "consultation",
          start: "2026-07-10T09:00:00.000Z",
          end: "2026-07-10T09:30:00.000Z"
        },
        {
          id: "booking-2",
          serviceId: "photo-session",
          start: "2026-07-10T10:00:00.000Z",
          end: "2026-07-10T11:00:00.000Z"
        }
      ],
      bookingRules: {
        maxBookingsPerDay: 2
      }
    });

    expect(
      engine.getAvailableSlots({
        serviceId: "consultation",
        date: "2026-07-10"
      })
    ).toEqual([]);
  });

  it("blocks slots when the per-service daily booking cap is already reached", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bookings: [
        {
          id: "booking-1",
          serviceId: "consultation",
          start: "2026-07-10T09:00:00.000Z",
          end: "2026-07-10T09:30:00.000Z"
        }
      ],
      bookingRules: {
        maxBookingsPerServicePerDay: 1
      }
    });

    expect(
      engine.getAvailableSlots({
        serviceId: "consultation",
        date: "2026-07-10"
      })
    ).toEqual([]);

    expect(
      engine.getAvailableSlots({
        serviceId: "photo-session",
        date: "2026-07-10"
      }).map((slot) => slot.start)
    ).toEqual([
      "2026-07-10T09:30:00.000Z",
      "2026-07-10T10:00:00.000Z",
      "2026-07-10T10:30:00.000Z",
      "2026-07-10T11:00:00.000Z"
    ]);
  });

  it("detects direct conflicts", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bookings: [
        {
          id: "booking-1",
          serviceId: "photo-session",
          start: "2026-07-10T10:00:00.000Z",
          end: "2026-07-10T11:00:00.000Z"
        }
      ]
    });

    expect(
      engine.hasConflict({
        serviceId: "consultation",
        start: "2026-07-10T10:30:00.000Z",
        end: "2026-07-10T11:00:00.000Z"
      })
    ).toBe(true);
  });

  it("returns configured services", () => {
    const engine = createBookingEngine(baseConfig);

    expect(engine.getServices()).toEqual(baseConfig.services);
  });

  it("returns date availability metadata", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      blackoutDates: ["2026-07-10"]
    });

    expect(engine.getAvailabilityForDate("2026-07-10")).toEqual({
      date: "2026-07-10",
      weekday: "friday",
      isBlackoutDate: true,
      isRecurringBlackout: false,
      isOverride: false,
      hasRecurringAvailability: false,
      windows: [{ start: "09:00", end: "12:00" }],
      timeZone: "UTC"
    });
  });

  it("returns override metadata when date-specific availability exists", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      dateOverrides: [
        {
          date: "2026-07-10",
          windows: [{ start: "13:00", end: "15:00" }]
        }
      ]
    });

    expect(engine.getAvailabilityForDate("2026-07-10")).toEqual({
      date: "2026-07-10",
      weekday: "friday",
      isBlackoutDate: false,
      isRecurringBlackout: false,
      isOverride: true,
      hasRecurringAvailability: false,
      windows: [{ start: "13:00", end: "15:00" }],
      timeZone: "UTC"
    });
  });

  it("returns recurring availability metadata when rules match a date", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      recurringAvailability: [
        {
          frequency: "weekly",
          weekdays: ["friday"],
          windows: [{ start: "13:00", end: "15:00" }]
        }
      ]
    });

    expect(engine.getAvailabilityForDate("2026-07-10")).toEqual({
      date: "2026-07-10",
      weekday: "friday",
      isBlackoutDate: false,
      isRecurringBlackout: false,
      isOverride: false,
      hasRecurringAvailability: true,
      windows: [
        { start: "09:00", end: "12:00" },
        { start: "13:00", end: "15:00" }
      ],
      timeZone: "UTC"
    });
  });

  it("checks whether a generated slot is available", () => {
    const engine = createBookingEngine(baseConfig);
    const [slot] = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-10"
    });

    expect(engine.isSlotAvailable(slot)).toBe(true);
  });

  it("returns false when a slot duration does not match the service", () => {
    const engine = createBookingEngine(baseConfig);

    expect(
      engine.isSlotAvailable({
        serviceId: "consultation",
        start: "2026-07-10T09:00:00.000Z",
        end: "2026-07-10T10:00:00.000Z"
      })
    ).toBe(false);
  });

  it("creates a booking from an available slot", () => {
    const engine = createBookingEngine(baseConfig);
    const [slot] = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-10"
    });

    expect(engine.createBooking({ id: "booking-1", slot })).toEqual({
      id: "booking-1",
      serviceId: "consultation",
      start: "2026-07-10T09:00:00.000Z",
      end: "2026-07-10T09:30:00.000Z"
    });
  });

  it("confirms a booking and returns the next engine state", () => {
    const engine = createBookingEngine(baseConfig);
    const [slot] = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-10"
    });

    const result = engine.confirmBooking({ id: "booking-1", slot });

    expect(result.status).toBe("confirmed");
    expect(result.booking).toEqual({
      id: "booking-1",
      serviceId: "consultation",
      start: "2026-07-10T09:00:00.000Z",
      end: "2026-07-10T09:30:00.000Z"
    });
    expect(result.engine.isSlotAvailable(slot)).toBe(false);
  });

  it("returns a duplicate result for an idempotent confirm request", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bookings: [
        {
          id: "booking-1",
          serviceId: "consultation",
          start: "2026-07-10T09:00:00.000Z",
          end: "2026-07-10T09:30:00.000Z"
        }
      ]
    });

    const result = engine.confirmBooking({
      id: "booking-1",
      slot: {
        serviceId: "consultation",
        start: "2026-07-10T09:00:00.000Z",
        end: "2026-07-10T09:30:00.000Z"
      }
    });

    expect(result.status).toBe("duplicate");
    expect(result.booking).toEqual({
      id: "booking-1",
      serviceId: "consultation",
      start: "2026-07-10T09:00:00.000Z",
      end: "2026-07-10T09:30:00.000Z"
    });
  });

  it("rejects reused booking ids with a different slot payload", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bookings: [
        {
          id: "booking-1",
          serviceId: "consultation",
          start: "2026-07-10T09:00:00.000Z",
          end: "2026-07-10T09:30:00.000Z"
        }
      ]
    });

    const result = engine.confirmBooking({
      id: "booking-1",
      slot: {
        serviceId: "consultation",
        start: "2026-07-10T09:30:00.000Z",
        end: "2026-07-10T10:00:00.000Z"
      }
    });

    expect(result).toEqual({
      status: "unavailable",
      engine: expect.any(Object),
      reason: "duplicate-booking-id"
    });
  });

  it("fails confirmation when the slot is no longer available at booking time", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bookings: [
        {
          id: "existing-booking",
          serviceId: "consultation",
          start: "2026-07-10T09:00:00.000Z",
          end: "2026-07-10T09:30:00.000Z"
        }
      ]
    });

    const result = engine.confirmBooking({
      id: "booking-1",
      slot: {
        serviceId: "consultation",
        start: "2026-07-10T09:00:00.000Z",
        end: "2026-07-10T09:30:00.000Z"
      }
    });

    expect(result).toEqual({
      status: "unavailable",
      engine: expect.any(Object),
      reason: "slot-unavailable"
    });
  });

  it("returns a new engine with an added booking", () => {
    const engine = createBookingEngine(baseConfig);
    const [slot] = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-10"
    });
    const booking = engine.createBooking({ id: "booking-1", slot });
    const nextEngine = engine.addBooking(booking);

    expect(engine.isSlotAvailable(slot)).toBe(true);
    expect(nextEngine.isSlotAvailable(slot)).toBe(false);
  });

  it("rejects createBooking when the id already exists", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bookings: [
        {
          id: "booking-1",
          serviceId: "consultation",
          start: "2026-07-10T09:00:00.000Z",
          end: "2026-07-10T09:30:00.000Z"
        }
      ]
    });

    expect(() =>
      engine.createBooking({
        id: "booking-1",
        slot: {
          serviceId: "consultation",
          start: "2026-07-10T10:00:00.000Z",
          end: "2026-07-10T10:30:00.000Z"
        }
      })
    ).toThrow("Booking id already exists: booking-1");
  });

  it("does not treat exact booking boundaries as conflicts", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bookings: [
        {
          id: "booking-1",
          serviceId: "photo-session",
          start: "2026-07-10T10:00:00.000Z",
          end: "2026-07-10T11:00:00.000Z"
        }
      ]
    });

    expect(
      engine.hasConflict({
        serviceId: "consultation",
        start: "2026-07-10T11:00:00.000Z",
        end: "2026-07-10T11:30:00.000Z"
      })
    ).toBe(false);
  });

  it("detects conflicts from bookings that cross midnight", () => {
    const engine = createBookingEngine({
      services: [{ id: "consultation", name: "Consultation", durationMinutes: 30 }],
      availability: {
        saturday: [{ start: "00:00", end: "02:00" }]
      },
      bookings: [
        {
          id: "late-booking",
          serviceId: "consultation",
          start: "2026-07-10T23:30:00.000Z",
          end: "2026-07-11T00:30:00.000Z"
        }
      ],
      slotIntervalMinutes: 30
    });

    const slots = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-11"
    });

    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-07-11T00:30:00.000Z",
      "2026-07-11T01:00:00.000Z",
      "2026-07-11T01:30:00.000Z"
    ]);
  });

  it("deduplicates slots from overlapping availability windows", () => {
    const engine = createBookingEngine({
      services: [{ id: "consultation", name: "Consultation", durationMinutes: 30 }],
      availability: {
        friday: [
          { start: "09:00", end: "10:00" },
          { start: "09:30", end: "10:30" }
        ]
      },
      slotIntervalMinutes: 30
    });

    const slots = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-10"
    });

    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-07-10T09:00:00.000Z",
      "2026-07-10T09:30:00.000Z",
      "2026-07-10T10:00:00.000Z"
    ]);
  });

  it("generates slots in a non-UTC business time zone", () => {
    const engine = createBookingEngine({
      services: [{ id: "consultation", name: "Consultation", durationMinutes: 30 }],
      availability: {
        friday: [{ start: "09:00", end: "11:00" }]
      },
      slotIntervalMinutes: 30,
      timeZone: "Europe/London"
    });

    const slots = engine.getAvailableSlots({
      serviceId: "consultation",
      date: "2026-07-10"
    });

    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-07-10T08:00:00.000Z",
      "2026-07-10T08:30:00.000Z",
      "2026-07-10T09:00:00.000Z",
      "2026-07-10T09:30:00.000Z"
    ]);
  });

  it("evaluates slot availability using the configured local date", () => {
    const engine = createBookingEngine({
      services: [{ id: "consultation", name: "Consultation", durationMinutes: 30 }],
      availability: {
        friday: [{ start: "00:00", end: "02:00" }]
      },
      slotIntervalMinutes: 30,
      timeZone: "Europe/London"
    });

    expect(
      engine.isSlotAvailable({
        serviceId: "consultation",
        start: "2026-07-09T23:00:00.000Z",
        end: "2026-07-09T23:30:00.000Z"
      })
    ).toBe(true);
  });

  it("applies booking constraints in direct slot availability checks", () => {
    const engine = createBookingEngine({
      services: [{ id: "consultation", name: "Consultation", durationMinutes: 30 }],
      availability: {
        friday: [{ start: "09:00", end: "12:00" }]
      },
      slotIntervalMinutes: 30,
      minimumNoticeMinutes: 90,
      now: "2026-07-10T08:00:00.000Z"
    });

    expect(
      engine.isSlotAvailable({
        serviceId: "consultation",
        start: "2026-07-10T09:00:00.000Z",
        end: "2026-07-10T09:30:00.000Z"
      })
    ).toBe(false);
  });

  it("applies production booking rules in direct slot availability checks", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      bookings: [
        {
          id: "booking-1",
          serviceId: "consultation",
          start: "2026-07-10T09:00:00.000Z",
          end: "2026-07-10T09:30:00.000Z"
        }
      ],
      bookingRules: {
        maxBookingsPerServicePerDay: 1
      }
    });

    expect(
      engine.isSlotAvailable({
        serviceId: "consultation",
        start: "2026-07-10T10:00:00.000Z",
        end: "2026-07-10T10:30:00.000Z"
      })
    ).toBe(false);
  });

  it("rejects invalid local dates", () => {
    const engine = createBookingEngine(baseConfig);

    expect(() =>
      engine.getAvailableSlots({
        serviceId: "photo-session",
        date: "2026-02-30"
      })
    ).toThrow("Invalid date: 2026-02-30");
  });

  it("rejects invalid local times", () => {
    expect(() =>
      createBookingEngine({
        services: [{ id: "consultation", name: "Consultation", durationMinutes: 30 }],
        availability: {
          friday: [{ start: "9:00", end: "17:00" }]
        }
      })
    ).toThrow("Invalid time: 9:00");
  });

  it("rejects duplicate date overrides", () => {
    expect(() =>
      createBookingEngine({
        ...baseConfig,
        dateOverrides: [
          { date: "2026-07-10", windows: [{ start: "13:00", end: "15:00" }] },
          { date: "2026-07-10", windows: [{ start: "15:00", end: "17:00" }] }
        ]
      })
    ).toThrow("Duplicate date override: 2026-07-10");
  });

  it("keeps blackout dates as a stronger rule than date overrides", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      blackoutDates: ["2026-07-10"],
      dateOverrides: [
        {
          date: "2026-07-10",
          windows: [{ start: "13:00", end: "15:00" }]
        }
      ]
    });

    expect(
      engine.getAvailableSlots({
        serviceId: "consultation",
        date: "2026-07-10"
      })
    ).toEqual([]);
  });

  it("blocks slots for recurring blackout rules", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      recurringBlackoutRules: [
        {
          frequency: "weekly",
          weekdays: ["friday"],
          startDate: "2026-07-01",
          endDate: "2026-07-31"
        }
      ]
    });

    expect(
      engine.getAvailableSlots({
        serviceId: "consultation",
        date: "2026-07-10"
      })
    ).toEqual([]);
  });

  it("marks recurring blackout metadata when a recurring blackout rule matches", () => {
    const engine = createBookingEngine({
      ...baseConfig,
      recurringBlackoutRules: [
        {
          frequency: "weekly",
          weekdays: ["friday"]
        }
      ]
    });

    expect(engine.getAvailabilityForDate("2026-07-10")).toEqual({
      date: "2026-07-10",
      weekday: "friday",
      isBlackoutDate: false,
      isRecurringBlackout: true,
      isOverride: false,
      hasRecurringAvailability: false,
      windows: [{ start: "09:00", end: "12:00" }],
      timeZone: "UTC"
    });
  });

  it("rejects invalid time zones", () => {
    expect(() =>
      createBookingEngine({
        services: [{ id: "consultation", name: "Consultation", durationMinutes: 30 }],
        availability: {
          friday: [{ start: "09:00", end: "17:00" }]
        },
        timeZone: "Mars/Olympus"
      })
    ).toThrow("Invalid time zone: Mars/Olympus");
  });

  it("rejects invalid recurring rule ranges and duplicate weekdays", () => {
    expect(() =>
      createBookingEngine({
        ...baseConfig,
        recurringAvailability: [
          {
            frequency: "weekly",
            weekdays: ["friday", "friday"],
            windows: [{ start: "13:00", end: "15:00" }]
          }
        ]
      })
    ).toThrow("Duplicate weekday in recurring availability: friday");

    expect(() =>
      createBookingEngine({
        ...baseConfig,
        recurringBlackoutRules: [
          {
            frequency: "weekly",
            weekdays: ["friday"],
            startDate: "2026-07-31",
            endDate: "2026-07-01"
          }
        ]
      })
    ).toThrow("recurring blackout rule startDate must be on or before endDate.");
  });

  it("rejects negative booking constraints", () => {
    expect(() =>
      createBookingEngine({
        ...baseConfig,
        minimumNoticeMinutes: -30
      })
    ).toThrow("minimumNoticeMinutes cannot be negative.");

    expect(() =>
      createBookingEngine({
        ...baseConfig,
        maxAdvanceDays: -1
      })
    ).toThrow("maxAdvanceDays cannot be negative.");
  });

  it("rejects invalid production booking rules", () => {
    expect(() =>
      createBookingEngine({
        ...baseConfig,
        bookingRules: {
          maxBookingsPerDay: -1
        }
      })
    ).toThrow("maxBookingsPerDay must be a non-negative integer.");

    expect(() =>
      createBookingEngine({
        ...baseConfig,
        bookingRules: {
          maxBookingsPerServicePerDay: 1.5
        }
      })
    ).toThrow("maxBookingsPerServicePerDay must be a non-negative integer.");
  });

  it("rejects bookings without timezone-safe date times", () => {
    expect(() =>
      createBookingEngine({
        services: [{ id: "consultation", name: "Consultation", durationMinutes: 30 }],
        availability: {
          friday: [{ start: "09:00", end: "17:00" }]
        },
        bookings: [
          {
            id: "booking-1",
            serviceId: "consultation",
            start: "2026-07-10T10:00:00",
            end: "2026-07-10T10:30:00.000Z"
          }
        ]
      })
    ).toThrow("Invalid ISO date time: 2026-07-10T10:00:00");
  });

  it("rejects duplicate service ids", () => {
    expect(() =>
      createBookingEngine({
        services: [
          { id: "consultation", name: "Consultation", durationMinutes: 30 },
          { id: "consultation", name: "Consultation Follow-up", durationMinutes: 45 }
        ],
        availability: {
          friday: [{ start: "09:00", end: "17:00" }]
        }
      })
    ).toThrow("Duplicate service id: consultation");
  });
});
