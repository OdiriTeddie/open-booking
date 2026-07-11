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
