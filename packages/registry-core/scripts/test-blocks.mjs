/**
 * Tests for the Part 6 blocks layer (acceptance 22–24):
 * - all 20 blocks emit registry:block items validating against the official
 *   shadcn registry-item JSON schema (fetched live at test time);
 * - manifest<->template agreement + token discipline enforced (positive);
 * - negative: a block with a raw hex, an undeclared component, and a missing
 *   axis value fails the build checks.
 */
/* global fetch: readonly, process: readonly */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import Ajv from "ajv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const require = createRequire(join(root, "package.json"));

const SCHEMA_URL = "https://ui.shadcn.com/schema/registry-item.json";

function emitFor(fixture) {
  const { buildRegistry } = require("./dist/index.js");
  const identity = JSON.parse(readFileSync(join(repoRoot, "fixtures", fixture), "utf8"));
  return buildRegistry(identity);
}

test("20 blocks emit registry:block items", () => {
  const items = emitFor("identity.arche.json");
  const { getBlockManifests } = require("./dist/index.js");
  const manifests = getBlockManifests();
  assert.equal(manifests.length, 20);
  for (const manifest of manifests) {
    assert.ok(items.has(manifest.name), `missing emitted item for ${manifest.name}`);
    const item = JSON.parse(items.get(manifest.name));
    assert.equal(item.type, "registry:block");
    assert.equal(item.files.length, 1);
    assert.equal(item.files[0].target, `components/blocks/${manifest.name}.tsx`);
    assert.equal(item.files[0].type, "registry:block");
    const catalog = new Set([...items.keys()].filter((n) => n !== "all" && n !== "theme"));
    for (const dep of item.registryDependencies) {
      assert.ok(catalog.has(dep), `${manifest.name}: registryDependency '${dep}' not in catalog`);
    }
  }
  const all = JSON.parse(items.get("all"));
  for (const manifest of manifests) {
    assert.ok(all.registryDependencies.includes(`@arche/${manifest.name}`), `all.json missing @arche/${manifest.name}`);
  }
});

test("block items validate against the official shadcn registry-item schema", async () => {
  const res = await fetch(SCHEMA_URL);
  assert.ok(res.ok, `schema fetch failed: ${res.status}`);
  const schema = await res.json();
  // Drop the pinned draft-07 $schema: ajv's bundled meta uses the http key
  // while the published schema pins the https key; validation of the item
  // shape does not depend on draft subtleties.
  delete schema.$schema;
  const ajv = new Ajv({ strict: false, allErrors: true });
  const validate = ajv.compile(schema);
  const items = emitFor("identity.arche.json");
  const { getBlockManifests } = require("./dist/index.js");
  for (const manifest of getBlockManifests()) {
    const item = JSON.parse(items.get(manifest.name));
    const ok = validate(item);
    assert.ok(ok, `${manifest.name}: ${JSON.stringify(validate.errors)?.slice(0, 400)}`);
  }
});

function fixtureFoundation() {
  const dir = mkdtempSync(join(tmpdir(), "arche-blocks-neg-"));
  for (const sub of ["src/manifests", "src/templates", "src/blocks", "src/contract"]) {
    mkdirSync(join(dir, sub), { recursive: true });
  }
  cpSync(
    join(repoRoot, "packages", "foundation", "src", "contract", "token-contract.json"),
    join(dir, "src", "contract", "token-contract.json"),
  );
  return dir;
}

function writeBlock(dir, { name, template, manifest }) {
  writeFileSync(join(dir, "src", "blocks", `${name}.tsx`), template);
  writeFileSync(join(dir, "src", "blocks", `${name}.block.json`), JSON.stringify(manifest));
}

function goodManifest(name) {
  return {
    name,
    title: name,
    description: "test block",
    category: "marketing",
    manifestVersion: 1,
    block: true,
    slots: [],
    axes: { layout: { values: ["grid", "split"], default: "grid" } },
    styleSurface: {},
    tokensUsed: ["--foreground"],
    dependencies: ["class-variance-authority"],
    registryDependencies: ["utils", "button"],
    files: [{ name, source: `src/blocks/${name}.tsx`, target: `components/blocks/${name}.tsx`, type: "registry:block" }],
    composition: {
      contentSlots: [],
      childComponents: [{ name: "button", min: 0, max: 2 }],
      headingRole: "h2",
    },
    standards: { purpose: "test", useWhen: [], doNotUseWhen: [], rules: [] },
  };
}

const GOOD_TEMPLATE = `"use client";
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../templates/lib/utils.js";
import { Button } from "../templates/button.js";
const xVariants = cva("flex flex-col gap-4 text-foreground", { variants: { layout: { grid: "grid", split: "split" } }, defaultVariants: { layout: "grid" } });
function X({ layout }: { layout?: "grid" | "split" }) { return <div data-block="x" className={cn(xVariants({ layout }))}><Button>Go</Button></div>; }
export { X };
`;

function runCheck(script, env) {
  // Invoke the checker directly via the foundation tsx binary (no pnpm
  // wrapper: spawning pnpm from inside the test runner is unreliable).
  const tsxBin = join(repoRoot, "packages", "foundation", "node_modules", ".bin", process.platform === "win32" ? "tsx.CMD" : "tsx");
  const scriptPath = join(repoRoot, "packages", "foundation", "scripts", `check-${script}.ts`);
  try {
    execFileSync(`"${tsxBin}" "${scriptPath}"`, {
      cwd: repoRoot,
      env: { ...process.env, ...env },
      stdio: "pipe",
      encoding: "utf8",
      shell: true,
    });
    return { ok: true, output: "" };
  } catch (err) {
    return { ok: false, output: String(err.stdout ?? "") + String(err.stderr ?? "") };
  }
}

test("negative: raw hex in a block template fails the token check", () => {
  const dir = fixtureFoundation();
  writeBlock(dir, {
    name: "bad",
    template: GOOD_TEMPLATE.replace("text-foreground", "text-[#ff0000]"),
    manifest: goodManifest("bad"),
  });
  const result = runCheck("token-only", { ARCHE_CHECK_DIRS: join(dir, "src", "blocks") });
  assert.equal(result.ok, false);
  assert.match(result.output, /raw hex color/);
});

test("negative: undeclared component + missing axis value fail agreement", () => {
  const dir = fixtureFoundation();
  writeBlock(dir, {
    name: "bad",
    template: GOOD_TEMPLATE.replace(
      'import { Button } from "../templates/button.js";',
      'import { Button } from "../templates/button.js";\nimport { Card } from "../templates/card.js";',
    ).replace('layout: { grid: "grid", split: "split" }', 'layout: { grid: "grid", split: "split", bento: "bento" }'),
    manifest: goodManifest("bad"),
  });
  const result = runCheck("manifest-template", { ARCHE_FOUNDATION_ROOT: dir });
  assert.equal(result.ok, false);
  assert.match(result.output, /undeclared component 'card'/);
  assert.match(result.output, /bento/);
});
