import type { DocsRoute } from "../types";

export function Hero({ route }: { route: DocsRoute }) {
  return (
    <section className="hero-band">
      <div className="hero-copy">
        <p className="eyebrow">Open Booking</p>
        <h1>Headless booking for service businesses</h1>
        <p className="hero-text">
          Pure scheduling logic in <code>@openbooking/core</code>, React primitives in
          <code>@openbooking/react</code>, and backend confirmation flows that stay
          version-safe.
        </p>
        <div className="install-row">
          <code>pnpm add @openbooking/core</code>
          <code>pnpm add @openbooking/react react</code>
        </div>
      </div>

      <div className="hero-aside">
        <div className="metric">
          <span>Current view</span>
          <strong>
            {route === "demo"
              ? "Demo"
              : route === "integration-guide"
                ? "Integration guide"
                : "API reference"}
          </strong>
        </div>
        <div className="metric">
          <span>Primary stack</span>
          <strong>TypeScript + React</strong>
        </div>
        <div className="metric">
          <span>Client package</span>
          <strong>@openbooking/react</strong>
        </div>
        <div className="metric">
          <span>Server package</span>
          <strong>@openbooking/core</strong>
        </div>
      </div>
    </section>
  );
}
