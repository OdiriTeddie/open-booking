import type { ReactNode } from "react";

export function ComparisonCard({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="comparison-card">
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
