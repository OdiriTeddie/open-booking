import { CodePanel } from "../components/CodePanel";
import { ComparisonCard } from "../components/ComparisonCard";
import { ReferenceGroup } from "../components/ReferenceGroup";
import { SectionHeading } from "../components/SectionHeading";
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
        <SectionHeading eyebrow="API reference" title="Core and React surface area" />
        <div className="comparison-grid">
          <ComparisonCard title="@openbooking/core">
            Headless scheduling, diagnostics, repository hydration, and final
            confirmation flows.
          </ComparisonCard>
          <ComparisonCard title="@openbooking/react">
            Hooks and starter UI that adapt the core engine for product-facing booking
            flows.
          </ComparisonCard>
        </div>
      </div>

      <section className="reference-grid">
        <div className="docs-panel">
          <SectionHeading eyebrow="Core" title="@openbooking/core" />
          <div className="reference-groups">
            {coreApiGroups.map((group) => (
              <ReferenceGroup items={group.items} key={group.title} title={group.title} />
            ))}
          </div>
          <CodePanel title="Core example">{coreExampleSnippet}</CodePanel>
        </div>

        <div className="docs-panel">
          <SectionHeading eyebrow="React" title="@openbooking/react" />
          <div className="reference-groups">
            {reactApiGroups.map((group) => (
              <ReferenceGroup items={group.items} key={group.title} title={group.title} />
            ))}
          </div>
          <CodePanel title="React example">{reactExampleSnippet}</CodePanel>
        </div>
      </section>
    </section>
  );
}
