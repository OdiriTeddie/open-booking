import type { ReactNode } from "react";

export function CodePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="code-panel">
      <h3>{title}</h3>
      <pre>{children}</pre>
    </article>
  );
}
