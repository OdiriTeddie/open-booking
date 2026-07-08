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
});
