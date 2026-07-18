export function formatReasonLabel(reason: string): string {
  switch (reason) {
    case "minimum-notice":
      return "Minimum notice";
    case "conflict":
      return "Existing conflict";
    case "max-bookings-per-day":
      return "Daily booking cap";
    case "blackout-date":
      return "Blackout date";
    case "outside-availability":
      return "Outside business hours";
    case "max-advance":
      return "Advance window";
    case "max-bookings-per-service-per-day":
      return "Service booking cap";
    case "invalid-slot-duration":
      return "Duration mismatch";
    case "unknown-service":
      return "Unknown service";
    default:
      return reason;
  }
}
