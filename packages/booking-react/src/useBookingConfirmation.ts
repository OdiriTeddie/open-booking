import type {
  BookingConfirmationResult,
  BookingHoldResult,
  BookingSlot,
  ConfirmHeldBookingInput,
  CreateBookingHoldInput
} from "@openbooking/core";
import { useState } from "react";

export interface UseBookingConfirmationInput {
  createHold?: (
    input: CreateBookingHoldInput
  ) => Promise<BookingHoldResult> | BookingHoldResult;
  confirmBooking?: (
    input: { bookingId: string; slot: BookingSlot }
  ) => Promise<BookingConfirmationResult> | BookingConfirmationResult;
  confirmHeldBooking?: (
    input: ConfirmHeldBookingInput
  ) => Promise<BookingConfirmationResult> | BookingConfirmationResult;
}

export interface BookingConfirmationState {
  isLoading: boolean;
  holdResult: BookingHoldResult | null;
  confirmationResult: BookingConfirmationResult | null;
  error: Error | null;
}

/**
 * React helper for wiring hold and confirmation actions to server-backed booking flows.
 *
 * The caller injects async actions from the application layer. This hook only manages
 * request state and result handling for React components.
 */
export function useBookingConfirmation(input: UseBookingConfirmationInput) {
  const [state, setState] = useState<BookingConfirmationState>({
    isLoading: false,
    holdResult: null,
    confirmationResult: null,
    error: null
  });

  async function requestHold(holdInput: CreateBookingHoldInput): Promise<BookingHoldResult> {
    if (!input.createHold) {
      throw new Error("createHold handler is required.");
    }

    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
      confirmationResult: null
    }));

    try {
      const result = await input.createHold(holdInput);

      setState((current) => ({
        ...current,
        isLoading: false,
        holdResult: result
      }));

      return result;
    } catch (error) {
      const normalizedError = normalizeError(error);

      setState((current) => ({
        ...current,
        isLoading: false,
        error: normalizedError
      }));

      throw normalizedError;
    }
  }

  async function confirmSlot(inputValue: {
    bookingId: string;
    slot: BookingSlot;
  }): Promise<BookingConfirmationResult> {
    if (!input.confirmBooking) {
      throw new Error("confirmBooking handler is required.");
    }

    setState((current) => ({
      ...current,
      isLoading: true,
      error: null
    }));

    try {
      const result = await input.confirmBooking(inputValue);

      setState((current) => ({
        ...current,
        isLoading: false,
        confirmationResult: result
      }));

      return result;
    } catch (error) {
      const normalizedError = normalizeError(error);

      setState((current) => ({
        ...current,
        isLoading: false,
        error: normalizedError
      }));

      throw normalizedError;
    }
  }

  async function confirmHeldSlot(
    inputValue: ConfirmHeldBookingInput
  ): Promise<BookingConfirmationResult> {
    if (!input.confirmHeldBooking) {
      throw new Error("confirmHeldBooking handler is required.");
    }

    setState((current) => ({
      ...current,
      isLoading: true,
      error: null
    }));

    try {
      const result = await input.confirmHeldBooking(inputValue);

      setState((current) => ({
        ...current,
        isLoading: false,
        confirmationResult: result
      }));

      return result;
    } catch (error) {
      const normalizedError = normalizeError(error);

      setState((current) => ({
        ...current,
        isLoading: false,
        error: normalizedError
      }));

      throw normalizedError;
    }
  }

  function reset(): void {
    setState({
      isLoading: false,
      holdResult: null,
      confirmationResult: null,
      error: null
    });
  }

  return {
    ...state,
    requestHold,
    confirmSlot,
    confirmHeldSlot,
    reset
  };
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error("Unknown booking confirmation error.");
}
