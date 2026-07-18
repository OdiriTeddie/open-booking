import { useEffect, useState } from "react";
import { DocsNav } from "./components/DocsNav";
import { Hero } from "./components/Hero";
import { ApiReferencePage } from "./pages/ApiReferencePage";
import { DemoPage } from "./pages/DemoPage";
import { IntegrationGuidePage } from "./pages/IntegrationGuidePage";
import { getRouteFromHash } from "./routing";
import type { DocsRoute } from "./types";

export function App() {
  const [route, setRoute] = useState<DocsRoute>(() => getRouteFromHash(window.location.hash));

  useEffect(() => {
    function handleHashChange(): void {
      setRoute(getRouteFromHash(window.location.hash));
    }

    window.addEventListener("hashchange", handleHashChange);

    if (!window.location.hash) {
      window.location.hash = "#/demo";
    }

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <main className="demo-shell">
      <Hero route={route} />
      <DocsNav route={route} />
      {route === "demo" ? <DemoPage /> : null}
      {route === "integration-guide" ? <IntegrationGuidePage /> : null}
      {route === "api-reference" ? <ApiReferencePage /> : null}
    </main>
  );
}
