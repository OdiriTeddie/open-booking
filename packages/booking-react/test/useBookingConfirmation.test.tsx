import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBookingConfirmation } from "../src";

describe("useBookingConfirmation", () => {
  it("stores a successful hold result", async () => {
    const { result } = renderHook(() =>
      useBookingConfirmation({
        async createHold(input) {
          return {
            status: "held",
            resource: {
              id: input.id,
              slot: input.slot,
              expiresAt: input.expiresAt
            },
            engine: {} as never
          };
        }
      })
    );

    await act(async () => {
      await result.current.requestHold({
        id: "hold-1",
        slot: {
          serviceId: "consultation",
          start: "2026-07-20T09:00:00.000Z",
          end: "2026-07-20T09:30:00.000Z"
        },
        expiresAt: "2026-07-18T12:10:00.000Z"
      });
    });

    expect(result.current.holdResult?.status).toBe("held");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("stores a successful direct confirmation result", async () => {
    const { result } = renderHook(() =>
      useBookingConfirmation({
        async confirmBooking(input) {
          return {
            status: "confirmed",
            resource: {
              id: input.bookingId,
              serviceId: input.slot.serviceId,
              start: input.slot.start,
              end: input.slot.end
            },
            engine: {} as never
          };
        }
      })
    );

    await act(async () => {
      await result.current.confirmSlot({
        bookingId: "booking-1",
        slot: {
          serviceId: "consultation",
          start: "2026-07-20T09:00:00.000Z",
          end: "2026-07-20T09:30:00.000Z"
        }
      });
    });

    expect(result.current.confirmationResult?.status).toBe("confirmed");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("stores a successful held confirmation result", async () => {
    const { result } = renderHook(() =>
      useBookingConfirmation({
        async confirmHeldBooking(input) {
          return {
            status: "confirmed",
            resource: {
              id: input.bookingId,
              serviceId: "consultation",
              start: "2026-07-20T09:00:00.000Z",
              end: "2026-07-20T09:30:00.000Z"
            },
            engine: {} as never
          };
        }
      })
    );

    await act(async () => {
      await result.current.confirmHeldSlot({
        holdId: "hold-1",
        bookingId: "booking-1"
      });
    });

    expect(result.current.confirmationResult?.status).toBe("confirmed");
    expect(result.current.isLoading).toBe(false);
  });

  it("captures thrown errors from async handlers", async () => {
    const { result } = renderHook(() =>
      useBookingConfirmation({
        async confirmBooking() {
          throw new Error("Server failed");
        }
      })
    );

    await expect(
      act(async () => {
        await result.current.confirmSlot({
          bookingId: "booking-1",
          slot: {
            serviceId: "consultation",
            start: "2026-07-20T09:00:00.000Z",
            end: "2026-07-20T09:30:00.000Z"
          }
        });
      })
    ).rejects.toThrow("Server failed");

    expect(result.current.error?.message).toBe("Server failed");
    expect(result.current.isLoading).toBe(false);
  });
});
