/* global process */
/**
 * Enterprise-demo coverage check: cross-references the foundation manifests
 * against apps/web/components/enterprise-demo.tsx and asserts every catalog
 * component has a Section and every manifest axis value is rendered at least
 * once (via the data-* hooks). Fails if a component is removed from the
 * demo rendering. Section markers nest, so chunks are parsed with a depth
 * counter rather than flat marker splitting.
 *
 * Usage: pnpm --filter web demo:check
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");
const repoRoot = join(webRoot, "..", "..");
const manifestsDir = join(repoRoot, "packages", "foundation", "src", "manifests");
const demoFile = join(webRoot, "components", "enterprise-demo.tsx");

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

const source = readFileSync(demoFile, "utf8");
const issues = [];
if (!source.includes("data-component={name}")) {
  console.error("check-enterprise-demo: FAILED — Section helper does not stamp data-component");
  process.exit(1);
}

// Parse <Section name="...">...</Section> pairs with a depth counter so
// nested sections attribute only their own content to each component.
const chunks = new Map();
const tagRe = /<(Section name="([^"]+)")|(\/Section)>/g;
const stack = [];
let match;
while ((match = tagRe.exec(source)) !== null) {
  if (match[3]) {
    const open = stack.pop();
    if (!open) {
      issues.push("unbalanced </Section> in demo source");
      continue;
    }
    const inner = source.slice(open.contentStart, match.index);
    chunks.set(open.name, (chunks.get(open.name) ?? "") + inner);
  } else {
    stack.push({ name: match[2], contentStart: match.index + match[0].length });
  }
}
if (stack.length > 0) {
  issues.push(`${stack.length} unclosed <Section> in demo source`);
}
if (chunks.size === 0) {
  console.error("check-enterprise-demo: FAILED — no data-component sections found");
  process.exit(1);
}

const collect = (chunk, attr) =>
  new Set([...chunk.matchAll(new RegExp(`${attr}="([^"]+)"`, "g"))].map((m) => m[1]));

for (const manifest of manifests) {
  const chunk = chunks.get(manifest.name);
  if (!chunk) {
    issues.push(`${manifest.name}: no demo section (missing data-component)`);
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
    issues.push(`${name}: demo section has no catalog manifest`);
  }
}

for (const issue of issues) {
  console.error(issue);
}
if (issues.length > 0) {
  console.error(`check-enterprise-demo: FAILED — ${issues.length} issue(s) across ${manifests.length} components`);
  process.exit(1);
} else {
  console.log(`check-enterprise-demo: passed (${manifests.length} components, all axis values rendered)`);
}
