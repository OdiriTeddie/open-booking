import { demoDateConfig } from "../data";
import { CodePanel } from "../components/CodePanel";
import { ComparisonCard } from "../components/ComparisonCard";
import { ReferenceGroup } from "../components/ReferenceGroup";
import { SectionHeading } from "../components/SectionHeading";
import { coreApiGroups, reactApiGroups } from "../data";
import {
  buildApiReferenceCoreSnippet,
  buildApiReferenceReactSnippet
} from "../snippets";

export function ApiReferencePage() {
  const coreExampleSnippet = buildApiReferenceCoreSnippet({
    blackoutDate: demoDateConfig.diagnostics.blackout,
    browseNow: demoDateConfig.clock.browseNow,
    confirmNow: demoDateConfig.clock.confirmNow,
    capacityDate: demoDateConfig.diagnostics.capacity
  });

  const reactExampleSnippet = buildApiReferenceReactSnippet(
    demoDateConfig.diagnostics.capacity
  );

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
