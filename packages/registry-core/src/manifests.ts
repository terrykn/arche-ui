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
  /** Present on block manifests with DNA-scored variants (Brief #8 D3):
   * affinity ranges per "axis-axis" combo key (missing range = no opinion). */
  variantAffinity?: Record<
    string,
    Partial<Record<"formality" | "energy" | "chroma" | "playfulness" | "warmth" | "density", readonly [number, number]>> & {
      notes: string;
    }
  >;
  /** Present on block manifests only (Part 6): typed composition contract. */
  composition?: {
    contentSlots: Array<{
      name: string;
      kind: "text" | "text-list" | "actions" | "media" | "records";
      required: boolean;
      max?: number;
    }>;
    childComponents: Array<{ name: string; min?: number; max?: number }>;
    headingRole: "h1" | "h2" | "none";
    landmark?: "banner" | "main" | "contentinfo" | "navigation" | "complementary";
  };
}

// Foundation is located without require.resolve (bundlers rewrite that call).
// From dist, up two levels lands on the package root's parent, so both the
// monorepo layout (packages/registry-core -> packages/foundation) and an
// installed layout (node_modules/@arche/registry-core ->
// node_modules/@arche/foundation) resolve statically.
function locateFoundation(): string {
  const candidates: string[] = [];
  try {
    const distDir = dirname(fileURLToPath(import.meta.url));
    candidates.push(
      join(distDir, "..", "..", "foundation"),
      join(distDir, "..", "..", "@arche", "foundation"),
    );
  } catch {
    // Bundled CommonJS output has no file URL; cwd candidates still resolve.
  }
  // Server builds bundle this package, so import.meta.url is a bundler chunk:
  // walk up from the process cwd to the repo/package root instead.
  let cwd = process.cwd();
  for (let i = 0; i < 6; i++) {
    candidates.push(join(cwd, "packages", "foundation"));
    candidates.push(join(cwd, "node_modules", "@arche", "foundation"));
    cwd = dirname(cwd);
  }
  const found = candidates.find((dir) => existsSync(join(dir, "src", "manifests")));
  if (!found) {
    throw new Error("@arche/foundation manifests not found from registry-core");
  }
  return found;
}

/** Foundation package root (for templates + contract assets). */
export const foundationDir: string = locateFoundation();

let cached: Manifest[] | null = null;
let cachedBlocks: Manifest[] | null = null;

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

/** All block manifests (Part 6; parsed, sorted by file). Read-only: do not mutate. */
export function getBlockManifests(): Manifest[] {
  if (!cachedBlocks) {
    const blocksDir = join(foundationDir, "src", "blocks");
    cachedBlocks = readdirSync(blocksDir)
      .filter((file) => file.endsWith(".block.json"))
      .sort()
      .map((file) => JSON.parse(readFileSync(join(blocksDir, file), "utf8")) as Manifest);
  }
  return cachedBlocks;
}

/** Components + blocks: the full installable catalog. */
export function getCatalogManifests(): Manifest[] {
  return [...getManifests(), ...getBlockManifests()];
}

/** The token contract (tokens + contrast pairs) for editor UI generation. */
export function getTokenContract(): unknown {
  return tokenContract;
}
