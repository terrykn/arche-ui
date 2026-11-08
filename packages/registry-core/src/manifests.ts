import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tokenContract from "@arche/foundation/contract/token-contract.json" with {
  type: "json",
};

export interface Manifest {
  name: string;
  title: string;
  description: string;
  category: string;
  manifestVersion: number;
  primitive?: { package: string; parts: string[]; propsInherited: boolean };
  native?: { element: string; parts?: string[]; propsInherited: boolean };
  slots: Array<{ name: string; part: string; required: boolean }>;
  axes: Record<string, { values: Array<string | number>; default: string | number }>;
  styleSurface: Record<string, Record<string, Record<string, unknown>>>;
  tokensUsed: string[];
  dependencies: string[];
  registryDependencies: string[];
  files: Array<{ name: string; source: string; target: string; type: string }>;
  standards: {
    purpose: string;
    useWhen: string[];
    doNotUseWhen: string[];
    rules: Array<{ id: string; severity: string; check: string }>;
  };
}

// Foundation is located without require.resolve (bundlers rewrite that call).
// From dist, up two levels lands on the package root's parent, so both the
// monorepo layout (packages/registry-core -> packages/foundation) and an
// installed layout (node_modules/@arche/registry-core ->
// node_modules/@arche/foundation) resolve statically.
function locateFoundation(): string {
  const distDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(distDir, "..", "..", "foundation"),
    join(distDir, "..", "..", "@arche", "foundation"),
  ];
  const found = candidates.find((dir) => existsSync(join(dir, "src", "manifests")));
  if (!found) {
    throw new Error("@arche/foundation manifests not found from registry-core");
  }
  return found;
}

/** Foundation package root (for templates + contract assets). */
export const foundationDir: string = locateFoundation();

let cached: Manifest[] | null = null;

/** All component manifests (parsed, sorted by file). Read-only: do not mutate. */
export function getManifests(): Manifest[] {
  if (!cached) {
    const manifestDir = join(foundationDir, "src", "manifests");
    cached = readdirSync(manifestDir)
      .filter((file) => file.endsWith(".manifest.json"))
      .sort()
      .map((file) => JSON.parse(readFileSync(join(manifestDir, file), "utf8")) as Manifest);
  }
  return cached;
}

/** The token contract (tokens + contrast pairs) for editor UI generation. */
export function getTokenContract(): unknown {
  return tokenContract;
}
