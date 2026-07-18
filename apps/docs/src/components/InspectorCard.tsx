import type { ReactNode } from "react";

export function InspectorCard({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="inspector-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
