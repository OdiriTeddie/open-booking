export function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(value));
}
