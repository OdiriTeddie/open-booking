import type { ReactNode } from "react";

export function GuideCard({
  label,
  value,
  wide = false
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`guide-card${wide ? " guide-card-wide" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
