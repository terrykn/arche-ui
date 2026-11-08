/* global process */
/**
 * Kitchen-sink coverage check (Part 2 acceptance 5): cross-references the
 * foundation manifests against apps/web/components/sink-blocks.tsx and
 * asserts every catalog component has a block and every manifest axis value
 * is rendered at least once (via the data-* hooks). Fails if a component is
 * removed from the catalog rendering.
 *
 * Usage: pnpm --filter web sink:check
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");
const repoRoot = join(webRoot, "..", "..");
const manifestsDir = join(repoRoot, "packages", "foundation", "src", "manifests");
const blocksFile = join(webRoot, "components", "sink-blocks.tsx");

const ATTR_FOR_AXIS = {
  variant: "data-variant",
  size: "data-size",
  controlSize: "data-size",
  density: "data-density",
  spacing: "data-spacing",
};

const manifests = readdirSync(manifestsDir)
  .filter((f) => f.endsWith(".manifest.json"))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(manifestsDir, f), "utf8")));

const source = readFileSync(blocksFile, "utf8");
const issues = [];
if (!source.includes("data-component={name}")) {
  console.error("check-kitchen-sink: FAILED — Block helper does not stamp data-component");
  process.exit(1);
}

// Split the source into per-block chunks at <Block name="..."> markers (each
// renders <section data-component={name}> at runtime — asserted below — so
// the static marker and the runtime hook identify the same block).
const markers = [...source.matchAll(/<Block name="([^"]+)">/g)];
if (markers.length === 0) {
  console.error("check-kitchen-sink: FAILED — no data-component blocks found");
  process.exit(1);
}
const chunks = new Map();
for (let i = 0; i < markers.length; i++) {
  const name = markers[i][1];
  const start = markers[i].index;
  const end = i + 1 < markers.length ? markers[i + 1].index : source.length;
  chunks.set(name, (chunks.get(name) ?? "") + source.slice(start, end));
}

const collect = (chunk, attr) =>
  new Set([...chunk.matchAll(new RegExp(`${attr}="([^"]+)"`, "g"))].map((m) => m[1]));

for (const manifest of manifests) {
  const chunk = chunks.get(manifest.name);
  if (!chunk) {
    issues.push(`${manifest.name}: no sink block (missing data-component)`);
    continue;
  }
  if (chunk.includes('data-missing="true"')) {
    issues.push(`${manifest.name}: sink block is a missing placeholder`);
    continue;
  }
  for (const [axis, spec] of Object.entries(manifest.axes)) {
    const attr = ATTR_FOR_AXIS[axis];
    if (!attr) {
      issues.push(`${manifest.name}: axis '${axis}' has no data-attribute mapping in the check`);
      continue;
    }
    const rendered = collect(chunk, attr);
    for (const value of spec.values) {
      if (!rendered.has(String(value))) {
        issues.push(`${manifest.name}: axis value '${value}' (${axis}) never rendered (${attr})`);
      }
    }
  }
}

for (const [name] of chunks) {
  if (!manifests.some((m) => m.name === name)) {
    issues.push(`${name}: sink block has no catalog manifest`);
  }
}

for (const issue of issues) {
  console.error(issue);
}
if (issues.length > 0) {
  console.error(`check-kitchen-sink: FAILED — ${issues.length} issue(s) across ${manifests.length} components`);
  process.exit(1);
} else {
  console.log(`check-kitchen-sink: passed (${manifests.length} components, all axis values rendered)`);
}
