/**
 * Syncs the Arche identity payload into apps/web theme CSS.
 *
 * The payload (fixtures/identity.arche.json) is the source of truth.
 * This script reuses the registry-core emission code path (buildRegistry)
 * and writes the theme item's cssVars into app/theme.css.
 * Never hand-edit theme.css — edit the payload, then re-run this script.
 *
 * Usage: pnpm --filter web sync-theme
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");
const repoRoot = join(webRoot, "..", "..");

const require = createRequire(join(webRoot, "package.json"));
const { buildRegistry } = require("@arche/registry-core");

const identityPath = join(repoRoot, "fixtures", "identity.arche.json");
const identity = JSON.parse(readFileSync(identityPath, "utf8"));

// Closed font registry: resolves the identity's font ids to next/font/google
// loader names, weights, and variable/static status.
const fontRegistry = JSON.parse(
  readFileSync(join(repoRoot, "packages", "foundation", "src", "fonts", "font-registry.json"), "utf8")
);
const fontById = new Map(fontRegistry.fonts.map((font) => [font.id, font]));

const items = buildRegistry(identity);
const theme = JSON.parse(items.get("theme"));

const light = theme.cssVars.light ?? {};
const dark = theme.cssVars.dark ?? {};
const mapped = theme.cssVars.theme ?? {};
const baseRoot = theme.css?.["@layer base"]?.[":root"] ?? {};

const block = (selector, vars) => {
  const lines = Object.keys(vars)
    .sort()
    .map((name) => `  --${name}: ${vars[name]};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
};

// NOTE: the @theme inline mapping must live in the Tailwind entry stylesheet
// (globals.css, between markers) — Tailwind v4 does not accept @theme from an
// @imported file in this pipeline. sync-theme writes :root/.dark/base here
// and rewrites the marked @theme block in globals.css from the same emission.

// NOTE: fonts load via registry:font items (next/font/google) or the
// fontsource npm package — never a Google Fonts @import inside a CSS file
// (that broke the Turbopack build once: @import must lead the entry
// stylesheet, and theme.css is inlined mid-bundle). The legacy font block is
// removed from globals.css below if still present.
const css = `/* GENERATED — do not hand-edit. Source: fixtures/identity.arche.json
 * Produced by apps/web/scripts/sync-theme.mjs via @arche/registry-core.
 * Edit the payload, then run: pnpm --filter web sync-theme */
${block(":root", light)}

${block(".dark", dark)}

@layer base {
  :root {
${Object.keys(baseRoot)
  .sort()
  .map((name) => `    --${name}: ${baseRoot[name]};`)
  .join("\n")}
  }
}
`;

writeFileSync(join(webRoot, "app", "theme.css"), css);

// Rewrite the marked @theme block in globals.css from the same emission.
const globalsPath = join(webRoot, "app", "globals.css");
const globals = readFileSync(globalsPath, "utf8");
// The emission maps colors + radius (shadcn-compat). The app additionally
// exposes the token set's font/shadow vars as Tailwind utilities (1:1 var
// refs, mode-independent). Same vars, same values — app-layer exposure only.
const supplement = Object.keys(light)
  .filter((name) => /^(font|shadow)-/.test(name))
  .sort()
  .map((name) => `  --${name}: var(--${name});`);
const themeBlock = [
  "/* @arche-theme:begin (generated — do not hand-edit) */",
  "@theme inline {",
  ...Object.keys(mapped)
    .sort()
    .map((name) => `  --${name}: ${mapped[name]};`),
  ...supplement,
  "}",
  "/* @arche-theme:end */",
].join("\n");
const marked = /\/\* @arche-theme:begin[\s\S]*?@arche-theme:end \*\//;
if (!marked.test(globals)) {
  throw new Error("globals.css is missing the /* @arche-theme:begin/end */ markers");
}
let updated = globals.replace(marked, themeBlock);
// Remove the legacy font @import block (superseded by registry:font items).
updated = updated
  .replace(/\/\* @arche-fonts:begin[\s\S]*?@arche-fonts:end \*\/\n?/, "")
  .replace(/^\n+/, "");
writeFileSync(globalsPath, updated);
// Fonts load via next/font/google, which requires static named imports in the
// importing file — so this script generates app/fonts.generated.ts from the
// identity's font selection (one loader call per unique family; slots sharing
// a family alias the first slot's instance since theme.css defines every
// slot var with the same family anyway).
const slotVars = { sans: "--font-sans", display: "--font-display", mono: "--font-mono" };
const slotNames = { sans: "fontSans", display: "fontDisplay", mono: "fontMono" };
const seenFamilies = new Map();
const fontImports = new Set();
const fontExports = [];
for (const slot of ["sans", "display", "mono"]) {
  const entry = fontById.get(identity.fonts[slot]);
  if (!entry) {
    throw new Error(`sync-theme: unknown font id '${identity.fonts[slot]}' for slot '${slot}'`);
  }
  fontImports.add(entry.nextFontImport);
  if (seenFamilies.has(entry.family)) {
    fontExports.push(`export const ${slotNames[slot]} = ${seenFamilies.get(entry.family)};`);
    continue;
  }
  seenFamilies.set(entry.family, slotNames[slot]);
  const weightArg = entry.variable ? "" : `\n  weight: [${entry.weights.map((w) => `"${w}"`).join(", ")}],`;
  fontExports.push(
    `export const ${slotNames[slot]} = ${entry.nextFontImport}({\n  subsets: ["latin"],${weightArg}\n  variable: "${slotVars[slot]}",\n});`
  );
}
const fontsGenerated = `/* GENERATED — do not hand-edit. Source: fixtures/identity.arche.json
 * Produced by apps/web/scripts/sync-theme.mjs. Edit the payload, then run:
 * pnpm --filter web sync-theme */
import { ${[...fontImports].sort().join(", ")} } from "next/font/google";

${fontExports.join("\n\n")}
`;
writeFileSync(join(webRoot, "app", "fonts.generated.ts"), fontsGenerated);
console.log(`sync-theme: wrote app/theme.css + @theme block + fonts.generated.ts from ${identity.meta.name}`);
