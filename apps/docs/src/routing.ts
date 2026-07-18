import type { DocsRoute } from "./types";

export function getRouteFromHash(hash: string): DocsRoute {
  if (hash === "#/api-reference") {
    return "api-reference";
  }

  if (hash === "#/integration-guide") {
    return "integration-guide";
  }

  return "demo";
}
