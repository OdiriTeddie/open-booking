import type { DocsRoute } from "../types";

export function DocsNav({ route }: { route: DocsRoute }) {
  return (
    <nav aria-label="Docs views" className="docs-route-nav">
      <a className="docs-route-link" data-selected={route === "demo"} href="#/demo">
        Demo
      </a>
      <a
        className="docs-route-link"
        data-selected={route === "integration-guide"}
        href="#/integration-guide"
      >
        Integration guide
      </a>
      <a
        className="docs-route-link"
        data-selected={route === "api-reference"}
        href="#/api-reference"
      >
        API reference
      </a>
    </nav>
  );
}
