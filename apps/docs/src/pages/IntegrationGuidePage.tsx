import { useState } from "react";
import { CodePanel } from "../components/CodePanel";
import { SectionHeading } from "../components/SectionHeading";
import { integrationGuides } from "../data";

export function IntegrationGuidePage() {
  const [selectedGuideId, setSelectedGuideId] = useState<(typeof integrationGuides)[number]["id"]>(
    "nextjs"
  );
  const selectedGuide =
    integrationGuides.find((guide) => guide.id === selectedGuideId) ?? integrationGuides[0];

  return (
    <section className="integration-guide" aria-label="Integration guide">
      <div className="docs-panel">
        <SectionHeading
          eyebrow="Integration guide"
          title="Framework-specific server confirmation examples"
        />
        <p className="guide-intro">
          The client keeps using <code>useBookingConfirmation</code>. The server owns hold
          persistence, final validation, and optimistic concurrency through
          <code>confirmBookingWithRetry</code>.
        </p>
        <div className="guide-tabs" role="tablist" aria-label="Framework examples">
          {integrationGuides.map((guide) => (
            <button
              aria-selected={guide.id === selectedGuide.id}
              className="guide-tab"
              data-selected={guide.id === selectedGuide.id}
              key={guide.id}
              onClick={() => setSelectedGuideId(guide.id)}
              role="tab"
              type="button"
            >
              {guide.label}
            </button>
          ))}
        </div>
        <div className="guide-layout">
          <div className="guide-copy">
            <div className="guide-card">
              <span>Framework</span>
              <strong>{selectedGuide.title}</strong>
            </div>
            <div className="guide-card">
              <span>Pattern</span>
              <strong>Hold on client, confirm on server</strong>
            </div>
            <div className="guide-card guide-card-wide">
              <span>Notes</span>
              <strong>{selectedGuide.description}</strong>
            </div>
          </div>
          <CodePanel title={selectedGuide.title}>{selectedGuide.snippet}</CodePanel>
        </div>
      </div>
    </section>
  );
}
