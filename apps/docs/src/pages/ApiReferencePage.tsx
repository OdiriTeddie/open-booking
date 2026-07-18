import { coreApiGroups, reactApiGroups } from "../data";

export function ApiReferencePage() {
  const coreExampleSnippet = `import {
  createBookingEngine,
  confirmBookingWithRetry
} from "@openbooking/core";

const engine = createBookingEngine({
  services,
  availability,
  bookings,
  bufferMinutes: 15,
  blackoutDates: ["2026-08-01"],
  minimumNoticeMinutes: 120,
  now: "2026-07-18T08:15:00.000Z"
});

const slots = engine.getSlotsWithAvailability({
  serviceId: "consultation",
  date: "2026-07-25"
});

const confirmation = await confirmBookingWithRetry({
  services,
  availability,
  repository,
  bookingId: "booking-42",
  holdId: "hold-42",
  slot: slots[0],
  now: "2026-07-18T12:05:00.000Z"
});`;

  const reactExampleSnippet = `import {
  useBooking,
  useBookingConfirmation
} from "@openbooking/react";

const booking = useBooking({
  services,
  availability,
  bookings,
  initialDate: "2026-07-25"
});

const confirmation = useBookingConfirmation({
  createHold: (input) => api.createHold(input),
  confirmHeldBooking: (input) => api.confirmHeldBooking(input)
});`;

  return (
    <section className="docs-stack" aria-label="API reference">
      <div className="docs-panel">
        <div className="section-heading">
          <p>API reference</p>
          <h2>Core and React surface area</h2>
        </div>
        <div className="comparison-grid">
          <article className="comparison-card">
            <h3>@openbooking/core</h3>
            <p>
              Headless scheduling, diagnostics, repository hydration, and final
              confirmation flows.
            </p>
          </article>
          <article className="comparison-card">
            <h3>@openbooking/react</h3>
            <p>
              Hooks and starter UI that adapt the core engine for product-facing booking
              flows.
            </p>
          </article>
        </div>
      </div>

      <section className="reference-grid">
        <div className="docs-panel">
          <div className="section-heading">
            <p>Core</p>
            <h2>@openbooking/core</h2>
          </div>
          <div className="reference-groups">
            {coreApiGroups.map((group) => (
              <div className="reference-group" key={group.title}>
                <h3>{group.title}</h3>
                <ul className="reference-list">
                  {group.items.map((item) => (
                    <li key={item}>
                      <code>{item}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <article className="code-panel">
            <h3>Core example</h3>
            <pre>{coreExampleSnippet}</pre>
          </article>
        </div>

        <div className="docs-panel">
          <div className="section-heading">
            <p>React</p>
            <h2>@openbooking/react</h2>
          </div>
          <div className="reference-groups">
            {reactApiGroups.map((group) => (
              <div className="reference-group" key={group.title}>
                <h3>{group.title}</h3>
                <ul className="reference-list">
                  {group.items.map((item) => (
                    <li key={item}>
                      <code>{item}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <article className="code-panel">
            <h3>React example</h3>
            <pre>{reactExampleSnippet}</pre>
          </article>
        </div>
      </section>
    </section>
  );
}
