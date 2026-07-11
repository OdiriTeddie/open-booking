import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBooking } from "../src";

const config = {
  services: [
    { id: "consultation", name: "Consultation", durationMinutes: 30 },
    { id: "photo-session", name: "Photo Session", durationMinutes: 60 }
  ],
  availability: {
    friday: [{ start: "09:00", end: "11:00" }]
  },
  slotIntervalMinutes: 30,
  initialDate: "2026-07-10"
} as const;

describe("useBooking", () => {
  it("selects the first service and generates slots", () => {
    const { result } = renderHook(() => useBooking(config));

    expect(result.current.selectedServiceId).toBe("consultation");
    expect(result.current.selectedDate).toBe("2026-07-10");
    expect(result.current.slots.map((slot) => slot.start)).toEqual([
      "2026-07-10T09:00:00.000Z",
      "2026-07-10T09:30:00.000Z",
      "2026-07-10T10:00:00.000Z",
      "2026-07-10T10:30:00.000Z"
    ]);
  });

  it("updates slots when the selected service changes", () => {
    const { result } = renderHook(() => useBooking(config));

    act(() => {
      result.current.selectService("photo-session");
    });

    expect(result.current.selectedServiceId).toBe("photo-session");
    expect(result.current.slots.map((slot) => slot.start)).toEqual([
      "2026-07-10T09:00:00.000Z",
      "2026-07-10T09:30:00.000Z",
      "2026-07-10T10:00:00.000Z"
    ]);
  });

  it("clears the selected slot when service or date changes", () => {
    const { result } = renderHook(() => useBooking(config));

    act(() => {
      result.current.selectSlot(result.current.slots[0]);
    });

    expect(result.current.selectedSlot?.start).toBe("2026-07-10T09:00:00.000Z");

    act(() => {
      result.current.selectService("photo-session");
    });

    expect(result.current.selectedSlot).toBeNull();

    act(() => {
      result.current.selectSlot(result.current.slots[0]);
      result.current.selectDate("2026-07-17");
    });

    expect(result.current.selectedSlot).toBeNull();
  });
});
