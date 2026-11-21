import { parse } from "@babel/parser";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Test hook (Part 6 negative tests): ARCHE_FOUNDATION_ROOT redirects the whole
// scanned tree (src/manifests, src/templates, src/blocks, src/contract).
const root = process.env.ARCHE_FOUNDATION_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestsDir = join(root, "src/manifests");
const templatesDir = join(root, "src/templates");
const contract = JSON.parse(readFileSync(join(root, "src/contract/token-contract.json"), "utf8")) as {
  tokens: Array<{ name: string; $type: string }>;
};

type AstNode = { type: string; [key: string]: unknown };
type Surface = { type: string; values?: Array<string | number>; scale?: Array<string | number>; default: string | number };
type Manifest = {
  name: string;
  axes: Record<string, { values: Array<string | number>; default: string | number }>;
  styleSurface: Record<string, Record<string, Surface>>;
  tokensUsed: string[];
  files: Array<{ source: string }>;
};

const issues: string[] = [];
const report = (component: string, message: string) => issues.push(`${component}: ${message}`);
const isNode = (value: unknown): value is AstNode =>
  typeof value === "object" && value !== null && "type" in value && typeof value.type === "string";
const propertyName = (node: unknown): string | undefined => {
  if (!isNode(node)) return undefined;
  if (node.type === "Identifier") return String(node.name);
  if (node.type === "StringLiteral" || node.type === "NumericLiteral") return String(node.value);
  return undefined;
};
function properties(node: unknown): AstNode[] {
  return isNode(node) && node.type === "ObjectExpression" && Array.isArray(node.properties)
    ? node.properties.filter(isNode).filter((prop) => prop.type === "ObjectProperty")
    : [];
}
function property(node: unknown, name: string): AstNode | undefined {
  return properties(node).find((prop) => propertyName(prop.key) === name);
}
function walk(value: unknown, visit: (node: AstNode) => void): void {
  if (Array.isArray(value)) {
    for (const element of value) walk(element, visit);
  } else if (isNode(value)) {
    visit(value);
    for (const [key, child] of Object.entries(value)) {
      if (!["loc", "start", "end", "comments", "leadingComments", "trailingComments", "innerComments", "tokens", "extra"].includes(key)) walk(child, visit);
    }
  }
}

const colorTokens = contract.tokens.filter((token) => token.$type === "color").map((token) => token.name);
const allTokens = new Set(contract.tokens.map((token) => token.name));
const findTokens = (text: string, found: Set<string>) => {
  for (const match of text.matchAll(/--[a-z][a-z0-9-]*/g)) {
    const name = match[0];
    if (allTokens.has(name)) found.add(name);
    else if (name.endsWith("-duration") || name.endsWith("-easing")) {
      const parent = name.replace(/-(duration|easing)$/, "");
      if (allTokens.has(parent)) found.add(parent);
    }
  }
  for (const part of text.split(/\s+/)) {
    const utility = part.split(":").at(-1)?.split("/")[0] ?? "";
    if (/^rounded(?:-[tblrse]{1,2})?(?:-(?:sm|md|lg|xl))?$/.test(utility)) found.add("--radius");
    if (/^(?:border|border-[trblxyse])$/.test(utility)) found.add("--border");
    for (const token of colorTokens) {
      const name = token.slice(2);
      // Shadow colors (shadow-brand/10) and gradient stops (from-/via-/to-)
      // are token-driven utilities, like bg- and text-.
      if (["bg", "text", "border", "ring", "outline", "fill", "stroke", "decoration", "placeholder", "caret", "ring-offset", "shadow", "from", "via", "to"].some((prefix) => utility === `${prefix}-${name}`)) found.add(token);
    }
    for (const token of ["--font-sans", "--font-mono", "--font-display", "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl"]) {
      if (utility === token.slice(2)) found.add(token);
    }
  }
};

const blocksDir = join(root, "src", "blocks");
const blockTemplatesDir = blocksDir;

/** Template files a block may compose: catalog components + the shared cn helper + sibling blocks (none yet). */
function checkBlockImports(manifest: Manifest & { composition?: { childComponents: Array<{ name: string }> } }, source: string) {
  const allowed = new Set((manifest.composition?.childComponents ?? []).map((c) => c.name));
  for (const match of source.matchAll(/from\s+["']\.\.\/templates\/([^"'./]+)(?:\.js)?["']/g)) {
    const dep = match[1];
    if (dep === "lib/utils") continue;
    if (!allowed.has(dep)) {
      report(manifest.name, `imports undeclared component '${dep}' (not in composition.childComponents)`);
    }
  }
  for (const match of source.matchAll(/from\s+["']\.\/([^"'./]+)(?:\.js)?["']/g)) {
    report(manifest.name, `imports sibling block '${match[1]}' — blocks compose catalog components only`);
  }
}

const manifestFiles = readdirSync(manifestsDir).filter((name) => name.endsWith(".manifest.json")).sort();
const componentTemplates = readdirSync(templatesDir).filter((name) => name.endsWith(".tsx")).sort();
const blockFiles = readdirSync(blocksDir).filter((name) => name.endsWith(".block.json")).sort();
const blockTemplates = readdirSync(blockTemplatesDir).filter((name) => name.endsWith(".tsx")).sort();
const covered = new Set<string>();
const coveredBlocks = new Set<string>();
function checkPair(manifestDir: string, file: string, coveredSet: Set<string>, isBlock: boolean) {
  const manifest = JSON.parse(readFileSync(join(manifestDir, file), "utf8")) as Manifest;
  const sourceFile = manifest.files[0]?.source;
  if (!sourceFile) { report(manifest.name, "missing template source"); return; }
  const templateName = sourceFile.split("/").at(-1)!;
  coveredSet.add(templateName);
  let source: string;
  try { source = readFileSync(join(root, sourceFile), "utf8"); }
  catch { report(manifest.name, `template not found: ${sourceFile}`); return; }
  if (isBlock) checkBlockImports(manifest, source);
  let ast: unknown;
  try { ast = parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] }); }
  catch (error) { report(manifest.name, `cannot parse template: ${String(error)}`); return; }

  const implemented = new Map<string, Set<string>>();
  const defaults = new Map<string, Set<string>>();
  // Axes of the file's first cva() call: the root component's variants.
  // Later cvas belong to sub-components (compositional props, not identity knobs).
  const rootCvaAxes = new Set<string>();
  let seenFirstCva = false;
  const referencedTokens = new Set<string>();
  walk(ast, (node) => {
    if (node.type === "StringLiteral" && typeof node.value === "string") findTokens(node.value, referencedTokens);
    if (node.type === "TemplateElement" && typeof node.value === "object" && node.value !== null && "raw" in node.value && typeof node.value.raw === "string") findTokens(node.value.raw, referencedTokens);
    if (node.type !== "CallExpression" || !isNode(node.callee) || node.callee.type !== "Identifier" || node.callee.name !== "cva" || !Array.isArray(node.arguments)) return;
    const isRootCva = !seenFirstCva;
    seenFirstCva = true;
    const config = node.arguments[1];
    for (const axis of properties(property(config, "variants")?.value)) {
      const name = propertyName(axis.key);
      if (!name) continue;
      if (isRootCva) rootCvaAxes.add(name);
      const values = implemented.get(name) ?? new Set<string>();
      for (const entry of properties(axis.value)) {
        const value = propertyName(entry.key);
        if (value !== undefined) values.add(value);
      }
      implemented.set(name, values);
    }
    for (const entry of properties(property(config, "defaultVariants")?.value)) {
      const name = propertyName(entry.key), value = propertyName(entry.value);
      if (name && value !== undefined) {
        const existing = defaults.get(name) ?? new Set<string>(); existing.add(value); defaults.set(name, existing);
      }
    }
  });

  const declared = new Map<string, Set<string>>();
  const expectedDefaults = new Map<string, Set<string>>();
  const declare = (axis: string, values: Array<string | number>, defaultValue: string | number) => {
    const current = declared.get(axis) ?? new Set<string>();
    for (const value of values) current.add(String(value));
    declared.set(axis, current);
    const ds = expectedDefaults.get(axis) ?? new Set<string>(); ds.add(String(defaultValue)); expectedDefaults.set(axis, ds);
  };
  // Token knobs (cssVar) ship as CSS variables, not cva defaults: implemented
  // means the template references the var, e.g. var(--x, fallback).
  const tokenKnobAxes = new Set<string>();
  for (const [axis, spec] of Object.entries(manifest.axes)) declare(axis, spec.values, spec.default);
  for (const surface of Object.values(manifest.styleSurface)) {
    for (const [name, spec] of Object.entries(surface)) {
      const axis = name === "defaultVariant" ? "variant" : name === "defaultSize" ? "size" : name === "radiusFrom" ? "radius" : name;
      if (typeof spec.cssVar === "string") {
        tokenKnobAxes.add(axis);
        if (!source.includes(spec.cssVar)) report(manifest.name, `knob ${name} (${spec.cssVar}) is not referenced in template`);
        continue;
      }
      const values = spec.values ?? spec.scale;
      if (!values) { report(manifest.name, `knob ${name} has no enumerable implementation`); continue; }
      declare(axis, values, spec.default);
    }
  }
  for (const [axis, values] of declared) {
    // Block knobs are plain props with JS defaults (e.g. ctaVariant), not cva
    // axes: implemented means the prop name appears in the template source.
    if (isBlock) {
      if (!source.includes(axis)) report(manifest.name, `declared axis or knob ${axis} is not implemented`);
      continue;
    }
    const actual = implemented.get(axis);
    if (!actual) { report(manifest.name, `declared axis or knob ${axis} is not implemented`); continue; }
    for (const value of values) if (!actual.has(value)) report(manifest.name, `${axis}: declared value ${value} is not implemented`);
  }
  void 0;
  for (const [axis, values] of implemented) {
    const expected = declared.get(axis);
    if (!expected) {
      if (!rootCvaAxes.has(axis)) continue;
      report(manifest.name, `implemented axis or knob ${axis} is not declared`);
      continue;
    }
    for (const value of values) if (!expected.has(value)) report(manifest.name, `${axis}: implemented value ${value} is not declared`);
  }
  for (const [axis, values] of expectedDefaults) {
    if (tokenKnobAxes.has(axis)) continue;
    // Blocks carry JS prop defaults instead of cva defaultVariants.
    if (isBlock) continue;
    const actual = defaults.get(axis);
    for (const value of values) if (!actual?.has(value)) report(manifest.name, `${axis}: manifest default ${value} is not implemented as a cva default`);
  }
  const declaredTokens = new Set(manifest.tokensUsed);
  // Block tokens are consumed by composed child components, so the block
  // file itself need not reference every declared token.
  if (!isBlock) for (const token of declaredTokens) if (!referencedTokens.has(token)) report(manifest.name, `declared token ${token} is not referenced`);
  for (const token of referencedTokens) if (!declaredTokens.has(token)) report(manifest.name, `referenced token ${token} is not declared`);
}
for (const file of manifestFiles) checkPair(manifestsDir, file, covered, false);
for (const file of blockFiles) checkPair(blocksDir, file, coveredBlocks, true);
for (const template of componentTemplates) if (!covered.has(template)) report(template, "template has no manifest");
for (const template of blockTemplates) if (!coveredBlocks.has(template)) report(template, "block template has no manifest");
for (const issue of issues) console.error(issue);
if (issues.length) {
  console.error(`check-manifest-template: failed with ${issues.length} issue(s)`);
  process.exitCode = 1;
} else {
  console.log(`check-manifest-template: passed (${manifestFiles.length} components, ${blockFiles.length} blocks)`);
}
